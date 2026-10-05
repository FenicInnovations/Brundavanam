import { apiClient } from "./apiClient";

export const supportApi = {
  // Public / Customer Submission
  createTicket: (data) => apiClient.post("/support/tickets", data),

  // Guest Tracking & Continuation (Simplified - only Ticket Reference required)
  getGuestTicket: (ticketNumber) =>
    apiClient.get("/support/tickets/track", { ticketNumber }),
  replyGuestTicket: (ticketNumber, data) =>
    apiClient.post("/support/tickets/track/messages", { ticketNumber, ...data }),

  // Authenticated Customer
  getMyTickets: () => apiClient.get("/support/customer/tickets"),
  getMyTicketById: (id) => apiClient.get(`/support/customer/tickets/${id}`),
  replyMyTicket: (id, data) => apiClient.post(`/support/customer/tickets/${id}/messages`, data),

  // Admin Workspace
  getAdminStats: () => apiClient.get("/support/admin/stats"),
  getAdminTickets: (params = {}) => apiClient.get("/support/admin/tickets", params),
  getAdminTicketById: (id) => apiClient.get(`/support/admin/tickets/${id}`),
  adminReply: (id, data) => apiClient.post(`/support/admin/tickets/${id}/reply`, data),
  adminAddInternalNote: (id, data) => apiClient.post(`/support/admin/tickets/${id}/internal-notes`, data),
  adminLogCall: (id, data) => apiClient.post(`/support/admin/tickets/${id}/call-notes`, data),
  adminUpdateStatus: (id, status) => apiClient.patch(`/support/admin/tickets/${id}/status`, { status }),
  adminUpdatePriority: (id, priority) => apiClient.patch(`/support/admin/tickets/${id}/priority`, { priority }),
  adminAssignTicket: (id, assignedTo) => apiClient.patch(`/support/admin/tickets/${id}/assign`, { assignedTo }),
  getAdminStaff: () => apiClient.get("/support/admin/staff"),
  getAdminSmtpStatus: () => apiClient.get("/support/admin/smtp-status"),
  sendAdminTestEmail: (recipientEmail) => apiClient.post("/support/admin/test-email", { recipientEmail }),
};
