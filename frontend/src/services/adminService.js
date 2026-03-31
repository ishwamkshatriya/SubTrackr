import apiClient from '../utils/apiClient';

// Dashboard
export const getAdminDashboard = () => apiClient.get('/dashboard/admin').then(res => res.data.dashboard);
export const getAnalyticsData = (params) => apiClient.get('/dashboard/analytics', { params });

// Analytics
export const getAnalytics = (params) => apiClient.get('/analytics', { params }).then(res => res.data);
export const getSubscriptionAnalytics = (params) => apiClient.get('/analytics/subscriptions', { params });
export const getRevenueAnalytics = (params) => apiClient.get('/analytics/revenue', { params });
export const getUsageAnalytics = (params) => apiClient.get('/analytics/usage', { params });
export const getTopPlans = (params) => apiClient.get('/analytics/top-plans', { params });
export const getChurnAnalytics = (params) => apiClient.get('/analytics/churn', { params });

// User Management
export const getAllUsers = (params) => apiClient.get('/admin/users', { params });
export const getUserById = (id) => apiClient.get(`/admin/users/${id}`);
export const updateUser = (id, data) => apiClient.put(`/admin/users/${id}`, data);
export const toggleUserStatus = (id) => apiClient.patch(`/admin/users/${id}/toggle-status`);

// Plan Management
export const getPlans = (params) => apiClient.get('/plans', { params }).then(res => res.data.plans);
export const createPlan = (data) => apiClient.post('/plans', data);
export const updatePlan = (id, data) => apiClient.put(`/plans/${id}`, data);
export const deletePlan = (id) => apiClient.delete(`/plans/${id}`);
export const togglePlanStatus = (id) => apiClient.patch(`/plans/${id}/toggle-status`);

// Discount Management
export const getDiscounts = (params) => apiClient.get('/admin/discounts', { params }).then(res => res.data.discounts);
export const getDiscountUsage = (params) => apiClient.get('/admin/discounts/usage', { params }).then(res => res.data);
export const createDiscount = (data) => apiClient.post('/admin/discounts', data);
export const updateDiscount = (id, data) => apiClient.put(`/admin/discounts/${id}`, data);
export const deleteDiscount = (id) => apiClient.delete(`/admin/discounts/${id}`);

// Subscription Management
export const getAllSubscriptions = (params) => apiClient.get('/subscriptions', { params });

// Notifications
export const sendNotification = (data) => apiClient.post('/admin/notifications/send', data);
export const sendNotificationToRole = (data) => apiClient.post('/admin/notifications/send-to-role', data);

// Audit Logs
export const getAuditLogs = (params) => apiClient.get('/audits', { params });
export const getAuditLogById = (id) => apiClient.get(`/audits/${id}`);
export const getUserAuditLogs = (userId, params) => apiClient.get(`/audits/user/${userId}`, { params });
export const getResourceAuditLogs = (resource, resourceId, params) => apiClient.get(`/audits/resource/${resource}/${resourceId}`, { params });
export const getAuditLogStats = (params) => apiClient.get('/audits/stats', { params });
export const getSecurityAuditLogs = (params) => apiClient.get('/audits/security', { params });
export const exportAuditLogs = (params) => apiClient.get('/audits/export', { params, responseType: 'blob' });
