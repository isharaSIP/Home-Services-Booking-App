const User = require("../models/User");

/**
 * @desc    Get list of service providers (filtered by approval status)
 * @route   GET /api/admin/providers
 * @access  Private (Admin only)
 */
const getProviders = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected', or undefined for all

    const query = { role: "provider" };
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query["providerDetails.approvalStatus"] = status;
    }

    const providers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: providers.length,
      providers,
    });
  } catch (error) {
    console.error("Get Providers Error:", error);
    return res.status(500).json({ message: "Server error fetching providers" });
  }
};

/**
 * @desc    Approve or Reject a Service Provider
 * @route   PUT /api/admin/verify-provider/:id
 * @access  Private (Admin only)
 */
const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const provider = await User.findById(id);

    if (!provider || provider.role !== "provider") {
      return res.status(404).json({ message: "Service Provider not found" });
    }

    if (action === "approve") {
      provider.isApprovedByAdmin = true;
      provider.providerDetails.approvalStatus = "approved";
      provider.providerDetails.rejectionReason = "";
    } else if (action === "reject") {
      provider.isApprovedByAdmin = false;
      provider.providerDetails.approvalStatus = "rejected";
      provider.providerDetails.rejectionReason =
        rejectionReason || "Verification documents did not meet system requirements.";
    }

    await provider.save();

    console.log("==========================================");
    console.log(`🛡️ [ADMIN ACTION] Provider ${action.toUpperCase()}D`);
    console.log(`👤 Name: ${provider.name}`);
    console.log(`📧 Email: ${provider.email}`);
    console.log("==========================================");

    return res.status(200).json({
      message: `Service Provider has been successfully ${action}d.`,
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        isApprovedByAdmin: provider.isApprovedByAdmin,
        approvalStatus: provider.providerDetails.approvalStatus,
        rejectionReason: provider.providerDetails.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Verify Provider Error:", error);
    return res.status(500).json({ message: "Server error reviewing provider" });
  }
};

module.exports = {
  getProviders,
  verifyProvider,
};
