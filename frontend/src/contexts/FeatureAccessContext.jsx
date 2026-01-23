import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { checkFeatureAccess, checkPublicFeatureAccess } from '../api/featureAccessApi';
import { useTenant } from '../context/TenantProvider';

const FeatureAccessContext = createContext(null);

export const FeatureAccessProvider = ({ children }) => {
    const { slug } = useTenant();
    const [plan, setPlan] = useState(null);
    const [features, setFeatures] = useState({
        arModels: false,
        kds: false,
        analytics: false,
    });
    const [limits, setLimits] = useState({
        maxDishes: 0,
        maxStaff: 0,
    });
    const [usage, setUsage] = useState({
        dishes: 0,
        staff: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFeatureAccess = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            let data;

            if (token) {
                // Authenticated check
                data = await checkFeatureAccess();
            } else if (slug) {
                // Public check for guest users
                data = await checkPublicFeatureAccess(slug);
            } else {
                // No token and no slug (e.g., landing page)
                setPlan(null);
                setFeatures({
                    arModels: false,
                    kds: false,
                    analytics: false,
                });
                setLoading(false);
                return;
            }

            if (data.success) {
                if (token) {
                    setPlan(data.plan);
                    setFeatures(data.features || {
                        arModels: false,
                        kds: false,
                        analytics: false,
                    });
                    setLimits(data.limits || {
                        maxDishes: 0,
                        maxStaff: 0,
                    });
                    setUsage(data.usage || {
                        dishes: 0,
                        staff: 0,
                    });
                } else {
                    // Public check only returns features
                    setPlan(null);
                    setFeatures(data.features || {
                        arModels: false,
                        kds: false,
                        analytics: false,
                    });
                    setLimits({
                        maxDishes: Infinity, // Don't restrict viewing on frontend
                        maxStaff: Infinity,
                    });
                    setUsage({
                        dishes: 0,
                        staff: 0,
                    });
                }
            }
        } catch (err) {
            // Only set error and log if it's not a 401 on a public page
            // axiosClient handles global 401 redirects, but we check token above
            console.error('Error fetching feature access:', err);
            setError(err.message || 'Failed to fetch feature access');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchFeatureAccess();
    }, [fetchFeatureAccess]);

    const hasFeature = useCallback((featureName) => {
        return features[featureName] === true;
    }, [features]);

    const canUseFeature = useCallback((featureName) => {
        return hasFeature(featureName);
    }, [hasFeature]);

    const isAtLimit = useCallback((limitName) => {
        if (limitName === 'dishes') {
            return usage.dishes >= limits.maxDishes;
        }
        if (limitName === 'staff') {
            return usage.staff >= limits.maxStaff;
        }
        return false;
    }, [usage, limits]);

    const getUsagePercentage = useCallback((limitName) => {
        if (limitName === 'dishes') {
            if (limits.maxDishes === 0) return 0;
            return Math.round((usage.dishes / limits.maxDishes) * 100);
        }
        if (limitName === 'staff') {
            if (limits.maxStaff === 0) return 0;
            return Math.round((usage.staff / limits.maxStaff) * 100);
        }
        return 0;
    }, [usage, limits]);

    const value = {
        plan,
        features,
        limits,
        usage,
        loading,
        error,
        hasFeature,
        canUseFeature,
        isAtLimit,
        getUsagePercentage,
        refresh: fetchFeatureAccess,
    };

    return (
        <FeatureAccessContext.Provider value={value}>
            {children}
        </FeatureAccessContext.Provider>
    );
};

FeatureAccessProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useFeatureAccess = () => {
    const context = useContext(FeatureAccessContext);
    if (!context) {
        throw new Error('useFeatureAccess must be used within a FeatureAccessProvider');
    }
    return context;
};

export default FeatureAccessContext;
