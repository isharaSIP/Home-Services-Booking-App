const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createProviderController, publicProvider } = require("../controllers/providerController");

const provider = { _id: "123456789012345678901234", name: "Test Provider", password: "secret", email: "private", otp: "123456", providerDetails: { category: "Plumbing", nicFront: "private-document", nicBack: "private-document", certificates: ["private-document"], price: 2500 } };
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test("directory exposes public fields only, never credentials or verification documents", () => {
  const result = publicProvider(provider);
  assert.equal(result.price, null);
  assert.equal(result.referencePrice, 2500);
  assert.equal(result.rating, null);
  assert.equal(result.latitude, null);
  assert.equal(result.verified, true);
  for (const secret of ["password", "email", "otp", "nicFront", "nicBack", "certificates"]) assert.ok(!JSON.stringify(result).includes(secret));
});

test("public pricing never exposes bank account instructions or treats an inspection fee as the repair price", () => {
  const fixture = { ...provider, providerDetails: { ...provider.providerDetails, pricing: { type: 'inspection', inspectionFeeMinor: 75000, inclusions: 'Diagnosis only', version: 'v1', bankDetails: 'PRIVATE BANK ACCOUNT' } } };
  const result = publicProvider(fixture);
  assert.equal(result.price, null);
  assert.equal(result.pricing.inspectionFeeMinor, 75000);
  assert.ok(!JSON.stringify(result).includes('PRIVATE BANK ACCOUNT'));
  assert.ok(!Object.hasOwn(result.pricing, 'bankDetails'));
});
test("list requires verified and approved providers and uses an inclusive projection", async () => {
  let query, projection;
  const controller = createProviderController({ find(q) { query = q; return { select(p) { projection = p; return this; }, sort() { return this; }, async lean() { return [provider]; } }; } });
  const res = response(); await controller.list({}, res);
  assert.deepEqual(query, { role: "provider", isVerified: true, isApprovedByAdmin: true, "providerDetails.approvalStatus": "approved" });
  assert.ok(!projection.includes("nicFront")); assert.ok(!projection.includes("-password"));
  assert.equal(res.body.total, 1); assert.equal(res.body.providers[0].id, provider._id);
});
test("profile rejects malformed IDs before querying, and hides unavailable providers", async () => {
  let query;
  const controller = createProviderController({ findOne(q) { query = q; return { select() { return this; }, async lean() { return null; } }; } });
  const invalid = response(); await controller.detail({ params: { id: "bad-id" } }, invalid); assert.equal(invalid.code, 400); assert.equal(query, undefined);
  const missing = response(); await controller.detail({ params: { id: provider._id } }, missing); assert.equal(missing.code, 404); assert.equal(query.isApprovedByAdmin, true); assert.equal(query.isVerified, true);
});
test("provider reviews validate sort and page then return database aggregates and a sorted page", async () => {
  let aggregatePipeline;
  const controller = createProviderController(
    { findOne() { return { select() { return this; }, async lean() { return { _id: provider._id, providerDetails: {} }; } }; } },
    null,
    { async aggregate(pipeline) {
      aggregatePipeline = pipeline;
      return [{
        summary: [{ total: 2, average: 4, five: 1, four: 1, three: 0, two: 0, one: 0 }],
        reviews: [{ rating: 5, comment: "Good work", createdAt: new Date("2026-10-01T00:00:00Z"), customerName: "Actual Customer", service: "Plumbing" }],
      }];
    } },
  );
  const run = async (query = {}) => {
    const res = response();
    await controller.reviews({ params: { id: provider._id }, query }, res);
    return res;
  };
  assert.equal((await run({ sort: "invented" })).code, 400);
  assert.equal((await run({ page: "0" })).code, 400);
  const res = await run({ sort: "highest", page: "2" });
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.summary, {
    averageRating: 4,
    totalReviews: 2,
    distribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
  });
  assert.equal(res.body.reviews[0].customerName, "Actual");
  assert.equal(res.body.pagination.page, 2);
  assert.equal(res.body.pagination.limit, 10);
  assert.equal(res.body.pagination.hasMore, false);
  assert.deepEqual(aggregatePipeline[0].$match, {
    provider: new (require("mongoose").Types.ObjectId)(provider._id),
    status: "completed",
    "review.rating": { $exists: true },
  });
  const facet = aggregatePipeline[1].$facet;
  assert.deepEqual(facet.reviews[0].$sort, { "review.rating": -1, "review.createdAt": -1, _id: -1 });
  assert.equal(facet.reviews[1].$skip, 10);
  assert.equal(facet.reviews[2].$limit, 10);
});
test("provider review endpoint returns an explicit empty summary without inventing reviews", async () => {
  const controller = createProviderController(
    { findOne() { return { select() { return this; }, async lean() { return { _id: provider._id, providerDetails: {} }; } }; } },
    null,
    { async aggregate() { return [{ summary: [], reviews: [] }]; } },
  );
  const res = response(); await controller.reviews({ params: { id: provider._id }, query: {} }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.summary, {
    averageRating: null,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  assert.deepEqual(res.body.reviews, []);
  assert.equal(res.body.pagination.hasMore, false);
});
test("database errors produce a retryable response without leaking details", async () => {
  const controller = createProviderController({ find() { throw new Error("private database URI"); } });
  const res = response(); await controller.list({}, res); assert.equal(res.code, 503); assert.ok(!JSON.stringify(res.body).includes("URI"));
});

test("provider routes require a valid session before exposing the directory", async () => {
  const express = require("express");
  const app = express();
  app.use("/api/providers", require("../routes/providerRoutes"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/providers`;
    for (const path of ["", `/${provider._id}`]) {
      const res = await fetch(base + path);
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { message: "Not authorized, no token provided" });
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
