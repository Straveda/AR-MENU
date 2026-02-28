import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthProvider";
import { useSocket } from "../../context/SocketProvider";
import { useToast } from "../../components/common/Toast/ToastContext";
import Loading from "../../components/common/Loading";

export default function WaiterDashboard() {
    const navigate = useNavigate();
    const { logout, user, isAuthenticated } = useAuth();
    const { showError } = useToast();
    const { socket, connect, joinRoom, leaveRoom } = useSocket();

    const [orders, setOrders] = useState({
        pending: [],
        preparing: [],
        ready: [],
        delivered: []
    });
    const [stats, setStats] = useState({
        activeTablesCount: 0,
        pendingOrders: 0,
        readyToServe: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const restaurant = useMemo(() => user?.restaurantId, [user]);
    const restaurantName = restaurant?.name || "Restaurant";
    const restaurantId = restaurant?._id || null;

    const fetchWaiterData = async () => {
        if (!isAuthenticated || !restaurantId) return;
        try {
            setRefreshing(true);
            const res = await axiosClient.get("/kds/getkdsorders");
            if (res.data.success) {
                const data = res.data.data;
                setOrders(data);

                const allActive = [...data.pending, ...data.preparing, ...data.ready];
                const activeTables = [...new Set(allActive.map(o => o.tableNumber).filter(Boolean))];

                setStats({
                    activeTablesCount: activeTables.length,
                    pendingOrders: data.pending.length + data.preparing.length,
                    readyToServe: data.ready.length
                });
            }
        } catch (error) {
            console.error("Error fetching waiter data:", error);
            showError("Failed to update service data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && restaurantId) {
            fetchWaiterData();

            connect();
            joinRoom(`KDS_ROOM_${restaurantId}`);

            const handleUpdate = () => fetchWaiterData();

            socket.on("kds_order_updated", handleUpdate);
            socket.on("order_created", handleUpdate);

            return () => {
                socket.off("kds_order_updated", handleUpdate);
                socket.off("order_created", handleUpdate);
                leaveRoom(`KDS_ROOM_${restaurantId}`);
            };
        }
    }, [isAuthenticated, restaurantId, socket]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) return <Loading message="Syncing with Kitchen..." />;

    const sortedActiveTables = [...new Set([...orders.pending, ...orders.preparing, ...orders.ready]
        .map(o => o.tableNumber)
        .filter(Boolean))]
        .sort((a, b) => a - b);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800">Service Station</h1>
                        <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            {restaurantName} • Waiter Terminal
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <p className="text-sm font-bold text-slate-700">{user?.username || "Staff"}</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{user?.roleTitle || "Waiter"}</p>
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

            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
                <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Active Tables
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {sortedActiveTables.map((num) => {
                            const tableOrders = [...orders.pending, ...orders.preparing, ...orders.ready].filter(o => o.tableNumber === num);
                            const mainStatus = tableOrders.some(o => o.orderStatus === 'Ready') ? 'Ready' :
                                tableOrders.some(o => o.orderStatus === 'Preparing') ? 'Preparing' : 'Pending';

                            return (
                                <div key={num} className={`px-4 py-3 rounded-2xl border shadow-sm flex flex-col items-center justify-center min-w-[100px] transition-all ${mainStatus === 'Ready' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'
                                    }`}>
                                    <p className="text-xl font-black">T{num}</p>
                                    <p className="text-[10px] font-bold uppercase opacity-70 mt-1 flex items-center gap-1">
                                        {tableOrders.length} {tableOrders.length === 1 ? 'Order' : 'Orders'}
                                        <span className="w-1 h-1 bg-current rounded-full"></span>
                                        {mainStatus}
                                    </p>
                                </div>
                            );
                        })}
                        {sortedActiveTables.length === 0 && (
                            <div className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center text-slate-400 font-bold">
                                No active tables at the moment.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Service Orders
                        </h2>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-100 uppercase">
                            {stats.pendingOrders + stats.readyToServe} Active
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...orders.pending, ...orders.preparing, ...orders.ready].map((order) => (
                            <div key={order.orderId} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5 border-b border-slate-50 flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                                            T{order.tableNumber || "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{order.orderCode}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${order.orderStatus === 'Pending' ? 'bg-slate-100 text-slate-600' :
                                        order.orderStatus === 'Ready' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            'bg-orange-50 text-orange-600 border border-orange-100'
                                        }`}>
                                        {order.orderStatus}
                                    </span>
                                </div>
                                <div className="p-5 space-y-3 bg-slate-50/30">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="w-5 h-5 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">{item.quantity}</span>
                                            <p className="text-sm font-bold text-slate-700">{item.name}</p>
                                        </div>
                                    ))}
                                </div>
                                {order.orderStatus === 'Ready' && (
                                    <div className="bg-emerald-50 p-2 text-center text-[10px] font-black uppercase text-emerald-700 animate-pulse">
                                        Ready to Serve
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Recently Delivered
                    </h2>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                        {orders.delivered.map((order) => (
                            <div key={order.orderId} className="p-5 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs border border-emerald-100">
                                        T{order.tableNumber || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{order.orderCode}</p>
                                        <p className="text-[10px] font-bold text-slate-400">Delivered {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="text-sm font-black text-slate-800">${(order.total || 0).toFixed(2)}</p>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-100">
                                        Closed
                                    </span>
                                </div>
                            </div>
                        ))}
                        {orders.delivered.length === 0 && (
                            <div className="p-10 text-center text-slate-400 font-bold">
                                No recently delivered orders.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
