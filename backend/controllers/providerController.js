const User = require("../models/User");
const mongoose = require("mongoose");

const APPROVED_PROVIDER = {
  role: "provider",
  isVerified: true,
  isApprovedByAdmin: true,
  "providerDetails.approvalStatus": "approved",
};

const REVIEW_SORTS = {
  recent: { "review.createdAt": -1, _id: -1 },
  highest: { "review.rating": -1, "review.createdAt": -1, _id: -1 },
  lowest: { "review.rating": 1, "review.createdAt": -1, _id: -1 },
};

const publicProvider = (provider) => {
  const details = provider.providerDetails || {};
  const pricing = details.pricing && typeof details.pricing === "object"
    ? { ...details.pricing }
    : null;
  if (pricing) delete pricing.bankDetails;

  return {
    id: String(provider._id),
    name: provider.name,
    avatar: provider.avatar || "",
    category: details.category || "",
    serviceArea: details.serviceArea || "",
    price: pricing?.type === 'fixed' ? pricing.amountMinor / 100 : pricing?.type === 'estimate' ? pricing.minMinor / 100 : null,
    referencePrice: !pricing && Number.isFinite(details.price) ? details.price : null,
    priceUnit: details.priceUnit || "visit",
    pricing,
    rating: details.rating ?? null,
    reviewCount: details.reviewCount ?? 0,
    latitude: details.latitude ?? null,
    longitude: details.longitude ?? null,
    nextAvailableAt: details.nextAvailableAt ?? null,
    acceptingRequests: details.acceptingRequests !== false,
    verified: true,
    bio: details.bio || "",
    experience: details.experience || "",
  };
};

const createProviderController = (UserModel, nextAppointment, BookingModel) => ({
  async list(_req, res) {
    try {
      const providers = await UserModel.find(APPROVED_PROVIDER)
        .select("name avatar providerDetails")
        .sort({ name: 1, _id: 1 })
        .lean();
      return res.status(200).json({
        total: providers.length,
        providers: await Promise.all(providers
          .filter((provider) => provider.providerDetails?.acceptingRequests !== false)
          .map(async provider => ({ ...publicProvider(provider), ...(nextAppointment ? { nextAvailableAt: await nextAppointment(provider) } : {}) }))),
      });
    } catch (error) {
      console.error("List Providers Error:", error);
      return res.status(503).json({ message: "Unable to load providers. Please try again." });
    }
  },

  async detail(req, res) {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid provider id." });
    }
    try {
      const provider = await UserModel.findOne({
        _id: req.params.id,
        ...APPROVED_PROVIDER,
      })
        .select("name avatar providerDetails")
        .lean();
      if (!provider) return res.status(404).json({ message: "Provider not found." });
      if (provider.providerDetails?.acceptingRequests === false) {
        return res.status(404).json({ message: "Provider not found." });
      }
      const rows = BookingModel ? await BookingModel.find({ provider: provider._id, status: "completed", 'review.rating': { $exists: true } }).select('review customerName service invoice.inspectionOnly').sort({ 'review.createdAt': -1 }).limit(20).lean() : [];
      const reviews = rows.map(b => ({ rating: b.review.rating, comment: b.review.comment, createdAt: b.review.createdAt, customerName: b.customerName?.trim().split(/\s+/)[0] || 'Customer', service: b.invoice?.inspectionOnly ? b.service + ' · Inspection only' : b.service }));
      return res.status(200).json({ provider: { ...publicProvider(provider), reviews, ...(nextAppointment ? { nextAvailableAt: await nextAppointment(provider) } : {}) } });
    } catch (error) {
      console.error("Get Provider Error:", error);
      return res.status(503).json({ message: "Unable to load this provider. Please try again." });
    }
  },

  async reviews(req, res) {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid provider id." });
    }

    const sort = req.query.sort === undefined ? "recent" : req.query.sort;
    const pageText = req.query.page === undefined ? "1" : req.query.page;
    if (typeof sort !== "string" || !Object.hasOwn(REVIEW_SORTS, sort)) {
      return res.status(400).json({ message: "Choose a valid review sort order." });
    }
    if (typeof pageText !== "string" || !/^[1-9]\d*$/.test(pageText) || Number(pageText) > 10000) {
      return res.status(400).json({ message: "Choose a valid review page." });
    }

    const page = Number(pageText);
    const limit = 10;
    try {
      const provider = await UserModel.findOne({
        _id: req.params.id,
        ...APPROVED_PROVIDER,
      }).select("_id providerDetails.acceptingRequests").lean();
      if (!provider || provider.providerDetails?.acceptingRequests === false) {
        return res.status(404).json({ message: "Provider not found." });
      }
      if (!BookingModel) {
        throw new Error("Booking model is unavailable.");
      }

      const [result] = await BookingModel.aggregate([
        { $match: { provider: new mongoose.Types.ObjectId(req.params.id), status: "completed", "review.rating": { $exists: true } } },
        {
          $facet: {
            summary: [{
              $group: {
                _id: null,
                total: { $sum: 1 },
                average: { $avg: "$review.rating" },
                five: { $sum: { $cond: [{ $eq: ["$review.rating", 5] }, 1, 0] } },
                four: { $sum: { $cond: [{ $eq: ["$review.rating", 4] }, 1, 0] } },
                three: { $sum: { $cond: [{ $eq: ["$review.rating", 3] }, 1, 0] } },
                two: { $sum: { $cond: [{ $eq: ["$review.rating", 2] }, 1, 0] } },
                one: { $sum: { $cond: [{ $eq: ["$review.rating", 1] }, 1, 0] } },
              },
            }],
            reviews: [
              { $sort: REVIEW_SORTS[sort] },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $project: {
                  _id: 0,
                  rating: "$review.rating",
                  comment: "$review.comment",
                  createdAt: "$review.createdAt",
                  customerName: "$customerName",
                  service: {
                    $cond: [
                      { $eq: ["$invoice.inspectionOnly", true] },
                      { $concat: ["$service", " · Inspection only"] },
                      "$service",
                    ],
                  },
                },
              },
            ],
          },
        },
      ]);

      const summary = result?.summary?.[0];
      const totalReviews = summary?.total || 0;
      const distribution = {
        5: summary?.five || 0,
        4: summary?.four || 0,
        3: summary?.three || 0,
        2: summary?.two || 0,
        1: summary?.one || 0,
      };
      const reviews = (result?.reviews || []).map((review) => ({
        ...review,
        customerName: review.customerName?.trim().split(/\s+/)[0] || "Customer",
      }));

      return res.status(200).json({
        summary: {
          averageRating: summary?.average ?? null,
          totalReviews,
          distribution,
        },
        reviews,
        pagination: {
          page,
          limit,
          hasMore: page * limit < totalReviews,
        },
      });
    } catch (error) {
      console.error("Get Provider Reviews Error:", error);
      return res.status(503).json({ message: "Unable to load reviews. Please try again." });
    }
  },
});

// Appointment starts and reservations are managed by the booking controller.
// Keep the original routes, but never create a second set of bookable intervals.
const calendarController = require('./bookingController').createBookingController(require('../models/Booking'), User);
const publicController = createProviderController(User, calendarController.nextPublishedAt, require('../models/Booking'));
const legacyReadOnly = (_req, res) => res.status(409).json({ message: 'Legacy intervals are preserved for reference. Use Calendar to publish or withdraw an explicit appointment instead.' });
module.exports = {
  createProviderController, publicProvider,
  list: publicController.list, detail: publicController.detail, reviews: publicController.reviews,
  getAvailability: calendarController.calendar,
  updateWorkingDays: calendarController.workingDays,
  toggleOffDate: calendarController.offDate,
  addSlot: legacyReadOnly, removeSlot: legacyReadOnly,
};
