import PropTypes from 'prop-types';
import { useFeatureAccess } from '../../contexts/FeatureAccessContext';

/**
 * FeatureGate component - conditionally renders content based on feature access
 * 
 * @param {string} feature - Feature name to check (arModels, kds, analytics)
 * @param {ReactNode} fallback - Component to show when feature is locked
 * @param {boolean} showUpgrade - Whether to show upgrade prompt (default: true)
 * @param {ReactNode} children - Content to show when feature is available
 */
export default function FeatureGate({ feature, fallback, showUpgrade = true, children }) {
    const { hasFeature, loading } = useFeatureAccess();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!hasFeature(feature)) {
        if (fallback) {
            return fallback;
        }

        if (showUpgrade) {
            return <LockedFeature feature={feature} />;
        }

        return null;
    }

    return <>{children}</>;
}

FeatureGate.propTypes = {
    feature: PropTypes.string.isRequired,
    fallback: PropTypes.node,
    showUpgrade: PropTypes.bool,
    children: PropTypes.node.isRequired,
};

// Import LockedFeature component
import LockedFeature from './LockedFeature';
