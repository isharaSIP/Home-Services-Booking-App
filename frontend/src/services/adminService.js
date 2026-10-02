import api from "./api";

export const adminService = {
  // Fetch providers filtered by status ('pending', 'approved', 'rejected')
  getProviders: async (status = "pending") => {
    const response = await api.get(`/admin/providers?status=${status}`);
    return response.data;
  },

  // Verify (Approve or Reject) a provider
  verifyProvider: async (providerId, action, rejectionReason = "") => {
    const response = await api.put(`/admin/verify-provider/${providerId}`, {
      action,
      rejectionReason,
    });
    return response.data;
  },
};

export default adminService;
