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

const adminDto = user => ({ id: String(user._id), _id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, isVerified: user.isVerified, isApprovedByAdmin: user.isApprovedByAdmin });
const accountInput = (body, passwordRequired = false) => {
  const { name, email, phone, password } = body || {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) throw new Error('Enter a full name of up to 120 characters.');
  if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Enter a valid email address.');
  if (typeof phone !== 'string' || !/^\+?[\d\s-]{7,18}$/.test(phone.trim())) throw new Error('Enter a valid phone number.');
  if ((passwordRequired || password) && (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72)) throw new Error('Password must be 6–72 bytes long.');
  return { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), ...(password ? { password } : {}) };
};
const adminError = (res, error, fallback) => res.status(error.httpStatus || (error.code === 11000 ? 409 : 503)).json({ message: error.httpStatus ? error.message : error.code === 11000 ? 'An account with this email or phone number already exists.' : fallback });

const getAllUsers = async (req, res) => {
  try {
    // User management needs account fields, never passwords or reset codes.
    const users = await User.find({}).select('name email phone role isVerified isApprovedByAdmin createdAt providerDetails.category providerDetails.experience providerDetails.qualifications providerDetails.approvalStatus providerDetails.rejectionReason providerDetails.nicFront providerDetails.nicBack providerDetails.certificates').sort({ createdAt: -1 }).lean();
    res.json({ total: users.length, customerCount: users.filter(u => u.role === 'customer').length, providerCount: users.filter(u => u.role === 'provider').length, adminCount: users.filter(u => u.role === 'admin').length, users });
  } catch (error) { adminError(res, error, 'Unable to load accounts. Please try again.'); }
};

const createAdmin = async (req, res) => {
  let input;
  try { input = accountInput(req.body, true); if (req.body.confirmPassword !== input.password) throw new Error('Passwords do not match.'); }
  catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    const duplicate = await User.exists({ $or: [{ email: input.email }, { phone: input.phone }] });
    if (duplicate) return res.status(409).json({ message: 'An account with this email or phone number already exists.' });
    // The model's existing save hook hashes the password.
    const admin = await User.create({ ...input, role: 'admin', isVerified: true, isApprovedByAdmin: true });
    res.status(201).json({ message: 'Admin account created successfully.', admin: adminDto(admin) });
  } catch (error) { adminError(res, error, 'Unable to create the administrator. Please try again.'); }
};

const updateAdminProfile = async (req, res) => {
  let input;
  try { input = accountInput(req.body); }
  catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    const user = await User.findOne({ _id: req.user._id, role: 'admin' });
    if (!user) return res.status(404).json({ message: 'Admin account not found.' });
    const duplicate = await User.exists({ _id: { $ne: user._id }, $or: [{ email: input.email }, { phone: input.phone }] });
    if (duplicate) return res.status(409).json({ message: 'An account with this email or phone number already exists.' });
    Object.assign(user, input); await user.save();
    res.json({ message: 'Admin profile updated successfully.', user: adminDto(user) });
  } catch (error) { adminError(res, error, 'Unable to update your profile. Please try again.'); }
};

const deleteAdminProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id, role: 'admin' });
    if (!user) return res.status(404).json({ message: 'Admin account not found.' });
    if (typeof req.body?.password !== 'string' || !(await user.matchPassword(req.body.password))) return res.status(400).json({ message: 'Enter your current password to confirm deletion.' });
    await User.db.transaction(async session => {
      const admins = await User.find({ role: 'admin' }).select('_id').sort({ _id: 1 }).session(session).lean();
      if (admins.length <= 1) throw Object.assign(new Error('The last administrator cannot be deleted. Create another admin account first.'), { httpStatus: 409 });
      // Both concurrent deletions write the same administrator rows and retry.
      await User.updateMany({ role: 'admin', _id: { $in: admins.map(a => a._id) } }, { $inc: { __v: 1 } }, { session });
      const deleted = await User.deleteOne({ _id: user._id, role: 'admin' }, { session });
      if (!deleted.deletedCount) throw Object.assign(new Error('Admin account no longer exists.'), { httpStatus: 404 });
    });
    res.json({ message: 'Admin account deleted successfully.' });
  } catch (error) { adminError(res, error, 'Unable to delete your account. Please try again.'); }
};

module.exports = {
  getProviders,
  verifyProvider,
  getAllUsers,
  createAdmin,
  updateAdminProfile,
  deleteAdminProfile,
  accountInput,
};
