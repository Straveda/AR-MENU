import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthProvider";
import { useSocket } from "../../context/SocketProvider";
import { useToast } from "../../components/common/Toast/ToastContext";
import Loading from "../../components/common/Loading";

export default function CashierDashboard() {
    const navigate = useNavigate();
    const { logout, user, isAuthenticated } = useAuth();
    const { showError, showInfo } = useToast();
    const { socket, connect, joinRoom, leaveRoom } = useSocket();

    const [stats, setStats] = useState({
        todayRevenue: 0,
        ordersCompleted: 0,
        avgOrderValue: 0
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const restaurant = useMemo(() => user?.restaurantId, [user]);
    const restaurantName = restaurant?.name || "Restaurant";
    const restaurantId = restaurant?._id || null;

    const fetchCashierData = async () => {
        if (!isAuthenticated || !restaurantId) return;
        try {
            setRefreshing(true);
            const res = await axiosClient.get("/kds/getkdsorders");
            if (res.data.success) {
                const delivered = res.data.data.delivered || [];
                setOrders(delivered);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayOrders = delivered.filter(order => new Date(order.createdAt) >= today);

                const revenue = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
                setStats({
                    todayRevenue: revenue,
                    ordersCompleted: todayOrders.length,
                    avgOrderValue: todayOrders.length ? (revenue / todayOrders.length).toFixed(2) : "0.00"
                });
            }
        } catch (error) {
            console.error("Error fetching cashier data:", error);
            showError("Failed to load dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && restaurantId) {
            fetchCashierData();

            connect();
            joinRoom(`KDS_ROOM_${restaurantId}`);

            const handleUpdate = () => fetchCashierData();

            socket.on("kds_order_updated", handleUpdate);
            socket.on("order_created", handleUpdate);

            return () => {
                socket.off("kds_order_updated", handleUpdate);
                socket.off("order_created", handleUpdate);
                leaveRoom(`KDS_ROOM_${restaurantId}`);
            };
        }
    }, [isAuthenticated, restaurantId, socket]);

    const handlePrint = (order) => {
        showInfo(`Printing receipt for ${order.orderCode}...`);
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) return <Loading message="Initializing Cashier Station..." />;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800">Cashier Hub</h1>
                        <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            {restaurantName} • Active Terminal
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <p className="text-sm font-bold text-slate-700">{user?.username || "Staff"}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{user?.roleTitle || "Cashier"}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
                            <p className="text-2xl font-black text-slate-800">${parseFloat(stats.todayRevenue).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Orders Completed</p>
                            <p className="text-2xl font-black text-slate-800">{stats.ordersCompleted}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 group">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg. Order Value</p>
                            <p className="text-2xl font-black text-slate-800">${stats.avgOrderValue}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Recently Delivered
                        </h2>
                        <button
                            onClick={fetchCashierData}
                            className={`p-2 rounded-lg text-slate-400 hover:text-indigo-600 ${refreshing ? 'animate-spin' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {orders.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                                No orders processed today.
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order.orderId} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            T{order.tableNumber || "N/A"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 tracking-tight">{order.orderCode}</p>
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-md">DELIVERED</span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                                {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
                                        <p className="text-xl font-black text-slate-800">${(order.total || 0).toFixed(2)}</p>
                                        <button
                                            onClick={() => handlePrint(order)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Print
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
