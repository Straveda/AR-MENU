import axiosClient from './axiosClient';

/**
 * Check feature access for current restaurant
 * Returns plan details, features, limits, and current usage
 */
export const checkFeatureAccess = async () => {
    const response = await axiosClient.get('/features/check');
    return response.data;
};

/**
 * Get current plan details
 */
export const getCurrentPlan = async () => {
    const response = await axiosClient.get('/features/plan');
    return response.data;
};
