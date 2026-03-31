import apiClient from '../utils/apiClient';

// Dashboard
export const getUserDashboard = () => apiClient.get('/dashboard/user').then(res => res.data.dashboard);

// Plans
export const getPlans = () => apiClient.get('/plans').then(res => res.data.plans);
export const getPlanById = (id) => apiClient.get(`/plans/${id}`);
export const comparePlans = (data) => apiClient.post('/plans/compare', data);

// Subscriptions
export const subscribe = (data) => apiClient.post('/subscriptions/subscribe', data);
export const getUserSubscriptions = () => apiClient.get('/subscriptions/my-subscriptions').then(res => res.data.subscriptions);
export const getSubscriptionById = (id) => apiClient.get(`/subscriptions/${id}`);
export const upgradeDowngrade = (data) => apiClient.put('/subscriptions/modify', data);
export const cancelSubscription = (id, data) => apiClient.put(`/subscriptions/cancel/${id}`, data);
export const renewSubscription = (id) => apiClient.put(`/subscriptions/renew/${id}`);
export const toggleAutoRenew = (id) => apiClient.patch(`/subscriptions/${id}/toggle-auto-renew`);

// User Profile
export const getUserProfile = () => apiClient.get('/users/profile');
export const updateUserProfile = (data) => apiClient.put('/users/profile', data);
export const getUserSubscriptionHistory = (params) => apiClient.get('/users/subscription-history', { params });
export const getUserUsageHistory = (params) => apiClient.get('/users/usage-history', { params });
export const getUserStats = () => apiClient.get('/users/stats');

// Notifications
export const getUserNotifications = (params) => apiClient.get('/users/notifications', { params });
export const markNotificationAsRead = (id) => apiClient.patch(`/users/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => apiClient.patch('/users/notifications/read-all');

// Recommendations
export const getRecommendations = (params) => apiClient.get('/recommendations', { params });
export const getChurnPrediction = () => apiClient.get('/recommendations/churn-prediction');
export const getUsageBasedRecommendations = (params) => apiClient.get('/recommendations/usage-based', { params });
export const getSeasonalRecommendations = () => apiClient.get('/recommendations/seasonal');
export const getPlanComparison = (data) => apiClient.post('/recommendations/compare', data);
export const getGlobalRecommendation = () => apiClient.get('/recommendations/global').then(res => res.data.recommendation);

// Discounts (public view)
export const getPublicDiscounts = () => apiClient.get('/plans/discounts/public').then(res => res.data.discounts);

// (duplicate removed)
