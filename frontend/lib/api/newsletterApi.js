import { apiClient } from "./apiClient";

export const newsletterApi = {
  /**
   * Public: Subscribe to newsletter
   */
  subscribe: (email, source = "footer") =>
    apiClient.post("/newsletter/subscribe", { email, source }),

  /**
   * Public: Unsubscribe
   */
  unsubscribe: (email) =>
    apiClient.post("/newsletter/unsubscribe", { email }),

  /**
   * Admin: Get subscribers with pagination and filters
   */
  getAdminSubscribers: (params = {}) =>
    apiClient.get("/newsletter/admin/subscribers", params),

  /**
   * Admin: Get newsletter analytics stats
   */
  getAdminStats: () =>
    apiClient.get("/newsletter/admin/stats"),

  /**
   * Admin: Update subscriber (status, notes, tags)
   */
  updateSubscriber: (id, data) =>
    apiClient.patch(`/newsletter/admin/${id}`, data),

  /**
   * Admin: Delete subscriber permanently
   */
  deleteSubscriber: (id) =>
    apiClient.delete(`/newsletter/admin/${id}`),

  /**
   * Admin: Dispatch broadcast announcement
   */
  broadcast: (payload) =>
    apiClient.post("/newsletter/admin/broadcast", payload),
};
