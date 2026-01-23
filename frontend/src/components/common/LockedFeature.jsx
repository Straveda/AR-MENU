import PropTypes from 'prop-types';
import { useFeatureAccess } from '../../contexts/FeatureAccessContext';

const FEATURE_METADATA = {
    arModels: {
        displayName: 'AR Models',
        description: 'Generate 3D models for an immersive menu experience',
        icon: (
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    kds: {
        displayName: 'Kitchen Display System',
        description: 'Real-time order management for your kitchen staff',
        icon: (
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    analytics: {
        displayName: 'Analytics',
        description: 'Detailed insights and reports for your restaurant',
        icon: (
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
};

/**
 * LockedFeature component - displays when a feature is not available in the current plan
 * 
 * @param {string} feature - Feature name (arModels, kds, analytics)
 * @param {string} customMessage - Optional custom message to display
 */
export default function LockedFeature({ feature, customMessage }) {
    const { plan } = useFeatureAccess();
    const metadata = FEATURE_METADATA[feature] || {
        displayName: feature,
        description: 'This feature is not available in your current plan',
        icon: (
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    };

    return (
        <div className="flex items-center justify-center min-h-[500px] p-8">
            <div className="max-w-md w-full">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
                    {/* Lock Icon with Feature Icon */}
                    <div className="relative inline-block mb-6">
                        <div className="text-gray-400">
                            {metadata.icon}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-2">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    {/* Feature Name */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {metadata.displayName}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-6">
                        {customMessage || metadata.description}
                    </p>

                    {/* Current Plan Badge */}
                    {plan && (
                        <div className="mb-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                                Current Plan: {plan.name}
                            </span>
                        </div>
                    )}

                    {/* Upgrade Message */}
                    <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Upgrade your plan</span> to unlock this feature and get access to advanced capabilities.
                        </p>
                    </div>

                    {/* Upgrade Button */}
                    <button
                        onClick={() => {
                            // TODO: Navigate to upgrade page or open upgrade modal
                            console.log('Upgrade clicked for feature:', feature);
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-800 hover:to-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Upgrade Plan
                    </button>

                    {/* Contact Support Link */}
                    <p className="mt-4 text-sm text-gray-500">
                        Questions?{' '}
                        <a href="#" className="text-gray-700 hover:text-gray-900 font-medium underline">
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

LockedFeature.propTypes = {
    feature: PropTypes.string.isRequired,
    customMessage: PropTypes.string,
};
