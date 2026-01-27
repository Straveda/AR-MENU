import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../common/Toast/ToastContext';
import { Loader2, Check } from 'lucide-react';

const PaymentModal = () => {
    const { user, restaurantId, refreshUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);

    if (user?.subscriptionStatus !== 'PAYMENT_PENDING') {
        return null;
    }

    // Extract plan details from user object
    const plan = user?.restaurantId?.planId;
    const planName = plan?.name || 'Selected Plan';
    const planPrice = plan?.price || 0;
    const planInterval = plan?.interval || 'MONTHLY';
    const planFeatures = plan?.features || {};

    const handleMockPayment = async () => {
        try {
            setLoading(true);

            // Extract planId - handle both populated (object with _id) and non-populated (string) cases
            const planId = plan?._id || plan;

            if (!planId) {
                showError('Plan details not found. Please contact support.');
                setLoading(false);
                return;
            }

            const initRes = await axiosClient.post('/platform/initiate-payment', { planId });

            // Simulate Razorpay Popup
            setTimeout(async () => {
                try {
                    await axiosClient.post('/platform/verify-payment', {
                        _paymentId: 'pay_mock_' + Date.now(),
                        _orderId: initRes.data.data.orderId,
                        _signature: 'sig_mock'
                    });

                    showSuccess('Payment Successful! Activating account...');
                    await refreshUser(); // This should update subscriptionStatus to ACTIVE
                    window.location.reload(); // Hard reload to clear any stale state
                } catch (verifyErr) {
                    showError(verifyErr.response?.data?.message || 'Payment Verification Failed');
                } finally {
                    setLoading(false);
                }
            }, 1000);

        } catch (error) {
            console.error('Payment initiation error:', error);
            showError(error.response?.data?.message || 'Failed to initiate payment');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#1a1f2e] rounded-xl border border-gray-800 shadow-2xl p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">💳</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Complete Your Subscription</h2>
                <p className="text-gray-400 mb-6">
                    Your account is currently pending payment. Please complete the payment to access your dashboard.
                </p>

                {/* Plan Details Card */}
                <div className="bg-[#0f1419] rounded-lg p-6 mb-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">{planName}</h3>
                    <div className="flex items-baseline justify-center mb-4">
                        <span className="text-4xl font-bold text-blue-400">₹{planPrice}</span>
                        <span className="text-gray-400 ml-2">/{planInterval.toLowerCase()}</span>
                    </div>

                    {/* Features List */}
                    {Object.keys(planFeatures).length > 0 && (
                        <div className="space-y-2 text-left">
                            {planFeatures.analytics && (
                                <div className="flex items-center text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                                    <span>Advanced Analytics</span>
                                </div>
                            )}
                            {planFeatures.arModels && (
                                <div className="flex items-center text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                                    <span>AR 3D Models</span>
                                </div>
                            )}
                            {planFeatures.kds && (
                                <div className="flex items-center text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                                    <span>Kitchen Display System (KDS)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleMockPayment}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            `Pay ₹${planPrice} Now`
                        )}
                    </button>

                    <button
                        onClick={() => window.location.href = '/login'}
                        className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
