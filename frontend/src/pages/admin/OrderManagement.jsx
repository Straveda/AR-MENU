import { useEffect, useState, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import { useToast } from "../../components/common/Toast/ToastContext";
import OrderCard from "../../components/admin/orders/OrderCard";
import Loading from "../../components/common/Loading";

export default function OrderManagement() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showSuccess, showError, showInfo } = useToast();

    const [allOrders, setAllOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const restaurantId = useMemo(() => user?.restaurantId?._id, [user]);

    // Fetch orders (reuse KDS endpoint)
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/kds/getkdsorders");
            if (res.data.success) {
                // Flatten orders from KDS format {pending: [], preparing: [], ready: [], delivered: []}
                const orders = [
                    ...res.data.data.pending.map(o => ({ ...o, orderStatus: 'Pending' })),
                    ...res.data.data.preparing.map(o => ({ ...o, orderStatus: 'Preparing' })),
                    ...res.data.data.ready.map(o => ({ ...o, orderStatus: 'Ready' })),
                    ...(res.data.data.delivered || []).map(o => ({ ...o, orderStatus: 'Delivered' }))
                ];
                setAllOrders(orders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            showError("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Socket.IO (reuse KDS events)
    useEffect(() => {
        if (!socket || !restaurantId) return;

        const handleNewOrder = () => {
            fetchOrders();
            showInfo("New order received!");
        };

        const handleOrderUpdate = () => {
            fetchOrders();
        };

        socket.on("order_created", handleNewOrder);
        socket.on("kds_order_updated", handleOrderUpdate);

        return () => {
            socket.off("order_created", handleNewOrder);
            socket.off("kds_order_updated", handleOrderUpdate);
        };
    }, [socket, restaurantId]);

    // Client-side filtering
    const filteredOrders = useMemo(() => {
        return allOrders.filter(order => {
            // Tab filter
            if (activeTab !== "all" && order.orderStatus !== activeTab) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    order.orderCode?.toLowerCase().includes(query) ||
                    order.tableNumber?.toLowerCase().includes(query)
                );
            }

            return true;
        });
    }, [allOrders, activeTab, searchQuery]);

    // Calculate status counts
    const statusCounts = useMemo(() => {
        return allOrders.reduce((acc, order) => {
            acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
            return acc;
        }, {});
    }, [allOrders]);

    const tabs = [
        { id: "all", label: "All Orders" },
        { id: "Pending", label: "Pending" },
        { id: "Preparing", label: "Preparing" },
        { id: "Ready", label: "Ready" },
        { id: "Delivered", label: "Delivered" },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="type-h1">Order Management</h1>
                    <p className="type-secondary mt-1">Track and manage incoming orders in real-time</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-6 border-b border-slate-200 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 type-label transition-all relative whitespace-nowrap text-sm ${activeTab === tab.id
                            ? "text-slate-900"
                            : "text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        {tab.label}
                        {tab.id !== "all" && statusCounts[tab.id] > 0 && (
                            <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {statusCounts[tab.id]}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by order ID or table number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Orders Grid */}
            {loading ? (
                <Loading message="Loading orders..." />
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-slate-500 font-medium">No orders found</p>
                    <p className="text-slate-400 text-sm mt-1">
                        {searchQuery ? "Try adjusting your search" : "Orders will appear here when customers place them"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredOrders.map((order) => (
                        <OrderCard key={order.orderId} order={order} onUpdate={fetchOrders} />
                    ))}
                </div>
            )}
        </div>
    );
}
