import { useEffect, useState, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import { useToast } from "../../components/common/Toast/ToastContext";
import notificationSound from "../../assets/notification.mp3";

export default function KDS() {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
    const { showError } = useToast();
    
    const [orders, setOrders] = useState({
        pending: [],
        preparing: [],
        ready: [],
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    const restaurant = useMemo(() => user?.restaurantId, [user]);
    const restaurantName = restaurant?.name || "";
    const restaurantId = restaurant?._id || null;

    const { socket, connect, disconnect, joinRoom, leaveRoom } = useSocket();

    const playNotificationSound = () => {
        try {
            const audio = new Audio(notificationSound);
            audio.play().catch(err => {
                
            });
        } catch (error) {
            
        }
    };

    const fetchOrders = async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const res = await axiosClient.get("/kds/getkdsorders");
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching KDS orders:", error);
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchOrders();
        }
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (!isAuthenticated || !restaurantId) return; 

        connect();
        joinRoom(`KDS_ROOM_${restaurantId}`);
        
        const handleNewOrder = (newOrder) => {
            const formattedOrder = {
                ...newOrder,
                orderId: newOrder._id,
                items: newOrder.orderItems || [], 
            };
            
            setOrders(prev => ({
                ...prev,
                pending: [...prev.pending, formattedOrder]
            }));
            
            playNotificationSound();
        };

        const handleOrderUpdate = () => {
                fetchOrders();
        }

        socket.on("order_created", handleNewOrder);
        socket.on("kds_order_updated", handleOrderUpdate); 

        const interval = setInterval(fetchOrders, 30000);

        return () => {
            socket.off("order_created", handleNewOrder);
            socket.off("kds_order_updated", handleOrderUpdate);
            leaveRoom(`KDS_ROOM_${restaurantId}`);
            disconnect();
            clearInterval(interval);
        };
    }, [isAuthenticated, restaurantId]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const updateStatus = async (orderCode, newStatus) => {
        setProcessing(orderCode);
        try {
            const res = await axiosClient.patch(`/kds/${orderCode}/status`, {
                status: newStatus,
            });

            if (res.data.success) {
                fetchOrders();
            }
        } catch (error) {
            console.error(`Error updating order ${orderCode}:`, error);
            showError(error.response?.data?.message || "Failed to update order status");
        } finally {
            setProcessing(null);
        }
    };

    const OrderCard = ({ order, status, buttonText, nextStatus, accentColor, btnColor }) => (
        <div className={`bg-white rounded-xl shadow-md p-5 mb-4 border-l-4 ${accentColor} border-t border-r border-b border-gray-100/50 animate-fade-in transition-all hover:shadow-lg`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="type-label opacity-80">Order</span>
                    <p className="type-metric">{order.orderCode}</p>
                </div>
                <div className="text-right">
                    <span className="type-label opacity-80">Table</span>
                    <p className="type-metric">{order.tableNumber}</p>
                </div>
            </div>

            <div className="mb-5 space-y-2.5">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between type-body border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-gray-900 font-medium">{item.name}</span>
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md type-caption font-bold">
                            x{item.quantity}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center type-caption text-gray-500 font-medium">
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${accentColor.replace('border-', 'bg-').replace('500', '100')} ${accentColor.replace('border-', 'text-').replace('500', '800')}`}>
                    {status}
                </span>
            </div>

            <button
                onClick={() => updateStatus(order.orderCode, nextStatus)}
                disabled={processing === order.orderCode}
                className={`w-full mt-4 py-3 rounded-lg font-bold text-white shadow-sm transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${btnColor}`}
            >
                {processing === order.orderCode ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Updating...
                    </span>
                ) : buttonText}
            </button>
        </div>
    );

    if (authLoading || (loading && !orders.pending.length && !orders.preparing.length && !orders.ready.length)) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                    <p className="text-gray-600">Loading Kitchen Display...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-amber-100 max-w-sm">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                         </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h2>
                    <p className="text-gray-600 mb-6 text-sm">Please log in to your kitchen account to access the display system.</p>
                    <button 
                        onClick={() => navigate("/login")}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg font-semibold transition-colors shadow-md"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
            {}
            <div className="bg-white border-b border-amber-100 px-6 py-4 shadow-sm flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="type-h1">👨‍🍳 Kitchen Display</h1>
                    {restaurantName && <span className="type-secondary border-l border-gray-300 pl-4">{restaurantName}</span>}
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-4 text-sm font-medium">
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full border border-yellow-200">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pending: {orders.pending.length}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-800 rounded-full border border-orange-200">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Preparing: {orders.preparing.length}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-800 rounded-full border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Ready: {orders.ready.length}
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm hover:shadow"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {}
            <div className="flex-1 overflow-hidden p-4">
                <div className="flex gap-4 h-full overflow-x-auto pb-2">

                    {}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-amber-200/50">
                        <div className="bg-white p-3 border-b border-yellow-100 sticky top-0 z-10 flex justify-between items-center px-4 shadow-sm">
                            <h2 className="type-h3 flex items-center gap-2">
                                <span className="w-2 h-8 bg-yellow-400 rounded-full"></span>
                                Pending
                            </h2>
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full type-body-sm font-bold border border-yellow-200">
                                {orders.pending.length}
                            </span>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            {orders.pending.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 italic opacity-60">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    No pending orders
                                </div>
                            ) : (
                                orders.pending.map((order) => (
                                    <OrderCard
                                        key={order.orderId}
                                        order={order}
                                        status="Pending"
                                        buttonText="Start Preparing →"
                                        nextStatus="Preparing"
                                        accentColor="border-yellow-400"
                                        btnColor="bg-yellow-500 hover:bg-yellow-600"
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-amber-200/50">
                        <div className="bg-white p-3 border-b border-orange-100 sticky top-0 z-10 flex justify-between items-center px-4 shadow-sm">
                            <h2 className="type-h3 flex items-center gap-2">
                                <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                                Preparing
                            </h2>
                            <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full type-body-sm font-bold border border-orange-200">
                                {orders.preparing.length}
                            </span>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            {orders.preparing.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 italic opacity-60">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                                    Kitchen is clear
                                </div>
                            ) : (
                                orders.preparing.map((order) => (
                                    <OrderCard
                                        key={order.orderId}
                                        order={order}
                                        status="Preparing"
                                        buttonText="Mark Ready →"
                                        nextStatus="Ready"
                                        accentColor="border-orange-500"
                                        btnColor="bg-orange-500 hover:bg-orange-600"
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-amber-200/50">
                        <div className="bg-white p-3 border-b border-green-100 sticky top-0 z-10 flex justify-between items-center px-4 shadow-sm">
                            <h2 className="type-h3 flex items-center gap-2">
                                <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                                Ready
                            </h2>
                            <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full type-body-sm font-bold border border-green-200">
                                {orders.ready.length}
                            </span>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            {orders.ready.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 italic opacity-60">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    No orders ready
                                </div>
                            ) : (
                                orders.ready.map((order) => (
                                    <OrderCard
                                        key={order.orderId}
                                        order={order}
                                        status="Ready"
                                        buttonText="Complete Order ✓"
                                        nextStatus="Completed"
                                        accentColor="border-green-500"
                                        btnColor="bg-green-600 hover:bg-green-700"
                                    />
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
