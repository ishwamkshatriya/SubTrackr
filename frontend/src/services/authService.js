import apiClient from '../utils/apiClient';

export const signIn = (data) => apiClient.post('/auth/signin', data);
export const signUp = (data) => apiClient.post('/auth/signup', data);
export const getProfile = () => apiClient.get('/auth/profile');
export const updateProfile = (data) => apiClient.put('/auth/profile', data);
export const changePassword = (data) => apiClient.put('/auth/change-password', data);
export const logout = () => apiClient.post('/auth/logout');
