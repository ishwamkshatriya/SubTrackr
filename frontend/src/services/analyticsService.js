import apiClient from '../utils/apiClient';

export const getAnalytics = (params) => apiClient.get('/analytics', { params });
export const getSubscriptionAnalytics = (params) => apiClient.get('/analytics/subscriptions', { params });
export const getRevenueAnalytics = (params) => apiClient.get('/analytics/revenue', { params });
export const getUsageAnalytics = (params) => apiClient.get('/analytics/usage', { params });
export const getTopPlans = (params) => apiClient.get('/analytics/top-plans', { params });
export const getTopPlansByYear = (params) => apiClient.get('/analytics/top-plans/yearly', { params });
export const getTopPlansCurrent = (params) => apiClient.get('/analytics/top-plans/current', { params });
export const getChurnAnalytics = (params) => apiClient.get('/analytics/churn', { params });
