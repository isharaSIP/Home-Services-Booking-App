// Only these public profile fields may leave the customer directory endpoint.
const PUBLIC_FIELDS = "name providerDetails.category providerDetails.experience providerDetails.qualifications providerDetails.bio providerDetails.serviceArea providerDetails.latitude providerDetails.longitude providerDetails.price providerDetails.priceUnit providerDetails.rating providerDetails.reviewCount providerDetails.nextAvailableAt";
const APPROVED = {
  role: "provider",
  isVerified: true,
  isApprovedByAdmin: true,
  "providerDetails.approvalStatus": "approved"
};
function publicProvider(user) {
  const d = user.providerDetails || {};
  return {
    id: String(user._id),
    name: user.name,
    category: d.category || "Other",
    verified: true,
    experience: d.experience || "",
    qualifications: d.qualifications || "",
    bio: d.bio || "",
    serviceArea: d.serviceArea || "",
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    price: d.price ?? null,
    priceUnit: d.priceUnit || "visit",
    rating: d.rating ?? null,
    reviewCount: d.reviewCount || 0,
    nextAvailableAt: d.nextAvailableAt || null
  };
}
function createProviderController(User) {
  return {
    async list(req, res) {
      try {
        const users = await User.find(APPROVED).select(PUBLIC_FIELDS).sort({
          name: 1,
          _id: 1
        }).lean();
        return res.json({
          providers: users.map(publicProvider),
          total: users.length
        });
      } catch {
        return res.status(503).json({
          message: "Providers are temporarily unavailable. Please try again."
        });
      }
    },
    async detail(req, res) {
      if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({
        message: "Invalid provider ID"
      });
      try {
        const user = await User.findOne({
          ...APPROVED,
          _id: req.params.id
        }).select(PUBLIC_FIELDS).lean();
        if (!user) return res.status(404).json({
          message: "This provider is no longer available."
        });
        return res.json({
          provider: publicProvider(user)
        });
      } catch {
        return res.status(503).json({
          message: "Unable to load this profile. Please try again."
        });
      }
    }
  };
}
module.exports = {
  createProviderController,
  publicProvider
};
