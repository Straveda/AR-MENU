import axiosClient from './axiosClient';

/**
 * Check feature access for current restaurant
 * Returns plan details, features, limits, and current usage
 */
export const checkFeatureAccess = async () => {
    const response = await axiosClient.get('/features/check');
    return response.data;
};

export const getCurrentPlan = async () => {
    const response = await axiosClient.get('/features/plan');
    return response.data;
};

/**
 * Check feature access for public menu (guest users)
 */
export const checkPublicFeatureAccess = async (slug) => {
    const response = await axiosClient.get(`/features/public/${slug}`);
    return response.data;
};
