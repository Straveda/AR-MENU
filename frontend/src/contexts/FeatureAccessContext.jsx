import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { checkFeatureAccess } from '../api/featureAccessApi';

const FeatureAccessContext = createContext(null);

export const FeatureAccessProvider = ({ children }) => {
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
            const data = await checkFeatureAccess();

            if (data.success) {
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
            }
        } catch (err) {
            console.error('Error fetching feature access:', err);
            setError(err.message || 'Failed to fetch feature access');
        } finally {
            setLoading(false);
        }
    }, []);

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
