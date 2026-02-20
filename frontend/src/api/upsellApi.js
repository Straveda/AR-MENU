import axiosClient from './axiosClient';

const upsellApi = {
    // Get dashboard stats
    getStats: async () => {
        const response = await axiosClient.get('/upsell/stats');
        return response.data;
    },

    // Get all rules with optional filters
    getRules: async (filters = {}) => {
        const response = await axiosClient.get('/upsell/rules', { params: filters });
        return response.data;
    },

    // Create new rule
    createRule: async (data) => {
        const response = await axiosClient.post('/upsell/rules', data);
        return response.data;
    },

    // Update rule
    updateRule: async (id, data) => {
        const response = await axiosClient.patch(`/upsell/rules/${id}`, data);
        return response.data;
    },

    // Delete rule
    deleteRule: async (id) => {
        const response = await axiosClient.delete(`/upsell/rules/${id}`);
        return response.data;
    },

    // Toggle rule active status
    toggleRule: async (id) => {
        const response = await axiosClient.patch(`/upsell/rules/${id}/toggle`);
        return response.data;
    },

    // Get AI-powered suggestions
    getSuggestions: async () => {
        const response = await axiosClient.get('/upsell/suggestions');
        return response.data;
    },

    // Get dishes for dropdown
    getDishes: async () => {
        const response = await axiosClient.get('/upsell/dishes');
        return response.data;
    },

    // Get recommendations for a specific dish
    getRecommendationsForDish: async (slug, dishId, context = 'VIEW_DISH') => {
        const response = await axiosClient.get(`/upsell/r/${slug}/recommendations/${dishId}`, {
            params: { context },
        });
        return response.data;
    },

    // Trigger analytics aggregation (for testing)
    triggerAnalytics: async () => {
        const response = await axiosClient.post('/upsell/trigger-analytics');
        return response.data;
    },

    // Generate AI explanation for a rule
    generateExplanation: async (ruleId) => {
        try {
            const response = await axiosClient.post(`/upsell/rules/${ruleId}/generate-explanation`);
            return response.data;
        } catch (error) {
            console.error('Error generating explanation:', error);
            throw error;
        }
    },

    // Get recommendations for cart
    getCartRecommendations: async (restaurantSlug, cartItems, cartTotal) => {
        try {
            const response = await axiosClient.post(`/upsell/r/${restaurantSlug}/cart-recommendations`, {
                cartItems, // array of dishIds
                cartTotal
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching cart recommendations:', error);
            throw error;
        }
    },
};

export default upsellApi;
