import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import notificationSound from "../../assets/notification.mp3";

export default function KDS() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState({
        pending: [],
        preparing: [],
        ready: [],
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [kdsToken, setKdsToken] = useState(localStorage.getItem('kdsToken'));
    const [restaurantName, setRestaurantName] = useState(localStorage.getItem('kdsRestaurantName') || '');

    // Login Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // Check auth on mount
    useEffect(() => {
        if (kdsToken) {
            setIsAuthenticated(true);
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [kdsToken]);

    // Socket Integration
    const socket = useSocket();

    const playNotificationSound = () => {
        try {
            const audio = new Audio(notificationSound);
            audio.play().catch(err => {
                // Autoplay policy might block this without interaction
            });
        } catch (error) {
            // Ignore audio errors
        }
    };

    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        socket.emit("join_kds");

        const handleNewOrder = (newOrder) => {
            // Format raw order from socket to match API response structure
            const formattedOrder = {
                ...newOrder,
                orderId: newOrder._id,
                items: newOrder.orderItems || [], // Map orderItems -> items
            };
            
            setOrders(prev => ({
                ...prev,
                pending: [...prev.pending, formattedOrder]
            }));
            
            playNotificationSound();
        };

        const handleOrderUpdate = (updatedOrder) => {
             // For now, re-fetching is safest to ensure all lists are consistent
             // Optimistic update is possible but tricky when moving between lists
             fetchOrders();
        }

        socket.on("order_created", handleNewOrder);

        
    }, [socket, isAuthenticated]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError("");

        try {
            const res = await axiosClient.post("/kds/login", { email, password });
            if (res.data.success) {
                const { token, restaurantName } = res.data;
                localStorage.setItem("kdsToken", token);
                localStorage.setItem("kdsRestaurantName", restaurantName);
                setKdsToken(token);
                setRestaurantName(restaurantName);
            }
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError(error.response?.data?.message || "Login failed");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("kdsToken");
        localStorage.removeItem("kdsRestaurantName");
        setKdsToken(null);
        setIsAuthenticated(false);
        setOrders({ pending: [], preparing: [], ready: [] });
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/kds/getkdsorders");
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching KDS orders:", error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

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
            alert(error.response?.data?.message || "Failed to update order status");
        } finally {
            setProcessing(null);
        }
    };

    // Helper to render an order card
    const OrderCard = ({ order, status, buttonText, nextStatus, accentColor, btnColor }) => (
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 border-l-4 ${accentColor} border-t border-r border-b border-gray-100 animate-fade-in`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order</span>
                    <p className="text-lg font-bold text-gray-800">{order.orderCode}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Table</span>
                    <p className="text-lg font-bold text-gray-800">{order.tableNumber}</p>
                </div>
            </div>

            <div className="mb-4 space-y-2">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-gray-700 font-medium">{item.name}</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            x{item.quantity}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${accentColor.replace('border-', 'bg-').replace('500', '100')} ${accentColor.replace('border-', 'text-').replace('500', '800')}`}>
                    {status}
                </span>
            </div>

            <button
                onClick={() => updateStatus(order.orderCode, nextStatus)}
                disabled={processing === order.orderCode}
                className={`w-full mt-3 py-2.5 rounded-lg font-bold text-white shadow-sm transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${btnColor}`}
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

    // --- LOGIN VIEW (Matches Login.jsx) ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-8">
                <div className="max-w-md w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Kitchen Display System
                        </h1>
                        <div className="w-16 h-1 bg-amber-600 mx-auto mb-3"></div>
                        <p className="text-gray-600">
                            Sign in to manage kitchen orders
                        </p>
                    </div>

                    {/* Login Form */}
                    <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6">
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Error Message */}
                            {loginError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <span className="text-sm font-medium">{loginError}</span>
                                    </div>
                                </div>
                            )}

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                                        placeholder="kds@restaurant.com"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-colors"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                {loginLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Login to Kitchen
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Authenticated Kitchen Access Only
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // --- LOADING VIEW ---
    if (loading && !orders.pending.length && !orders.preparing.length && !orders.ready.length) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                    <p className="text-gray-600">Loading Kitchen Display...</p>
                </div>
            </div>
        );
    }

    // --- KDS BOARD VIEW (Matches Dashboard.jsx) ---
    return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-amber-100 px-6 py-4 shadow-sm flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-wide">👨‍🍳 Kitchen Display</h1>
                    {restaurantName && <span className="text-gray-400 text-sm border-l border-gray-300 pl-4">{restaurantName}</span>}
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

            {/* Columns Container */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="flex gap-4 h-full overflow-x-auto pb-2">

                    {/* COLUMN 1: PENDING (Yellow) */}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-amber-200/50">
                        <div className="bg-white p-3 border-b border-yellow-100 sticky top-0 z-10 flex justify-between items-center px-4 shadow-sm">
                            <h2 className="font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-8 bg-yellow-400 rounded-full"></span>
                                Pending
                            </h2>
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-sm font-bold border border-yellow-200">
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

                    {/* COLUMN 2: PREPARING (Orange) */}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-amber-200/50">
                        <div className="bg-white p-3 border-b border-orange-100 sticky top-0 z-10 flex justify-between items-center px-4 shadow-sm">
                            <h2 className="font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                                Preparing
                            </h2>
                            <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full text-sm font-bold border border-orange-200">
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

                    {/* COLUMN 3: READY (Green) */}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-amber-200/50">
                        <div className="bg-white p-3 border-b border-green-100 sticky top-0 z-10 flex justify-between items-center px-4 shadow-sm">
                            <h2 className="font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                                Ready
                            </h2>
                            <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-sm font-bold border border-green-200">
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
