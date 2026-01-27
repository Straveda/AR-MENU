import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import PaymentModal from '../components/payment/PaymentModal';

const PaymentGuard = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>;
    }

    // If subscription is pending payment, block access and show modal
    if (user?.subscriptionStatus === 'PAYMENT_PENDING') {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
                <PaymentModal />
            </div>
        );
    }

    return <Outlet />;
};

export default PaymentGuard;
