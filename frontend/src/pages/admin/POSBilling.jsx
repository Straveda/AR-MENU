import { useEffect, useState, useMemo } from "react";
import axiosClient from "../../api/axiosClient";
import { useSocket } from "../../context/SocketProvider";
import { useAuth } from "../../context/AuthProvider";
import { useToast } from "../../components/common/Toast/ToastContext";
import Loading from "../../components/common/Loading";
import BillDetailsModal from "../../components/admin/pos/BillDetailsModal";
import DayCloseModal from "../../components/admin/pos/DayCloseModal";

export default function POSBilling() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showSuccess, showError, showInfo } = useToast();

    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("open");
    const [loading, setLoading] = useState(true);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDayCloseModal, setShowDayCloseModal] = useState(false);

    const restaurantId = useMemo(() => user?.restaurantId?._id, [user]);

    // Fetch orders
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/kds/getkdsorders");
            if (res.data.success) {
                const allOrders = [
                    ...res.data.data.pending.map(o => ({ ...o, orderStatus: 'Pending' })),
                    ...res.data.data.preparing.map(o => ({ ...o, orderStatus: 'Preparing' })),
                    ...res.data.data.ready.map(o => ({ ...o, orderStatus: 'Ready' })),
                    ...(res.data.data.delivered || []).map(o => ({ ...o, orderStatus: 'Delivered' }))
                ];
                setOrders(allOrders);
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

    // Socket.IO real-time updates
    useEffect(() => {
        if (!socket || !restaurantId) return;

        const handleUpdate = () => fetchOrders();

        socket.on("order_created", handleUpdate);
        socket.on("kds_order_updated", handleUpdate);

        return () => {
            socket.off("order_created", handleUpdate);
            socket.off("kds_order_updated", handleUpdate);
        };
    }, [socket, restaurantId]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });

        const openOrders = orders.filter(o =>
            o.orderStatus === 'Pending' || o.orderStatus === 'Preparing' || o.orderStatus === 'Ready'
        ).length;

        const todaysSales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const taxCollected = todayOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

        // Payment split - Note: Payment methods are not currently tracked in orders
        // This is placeholder data until payment method tracking is implemented
        const paymentSplit = {
            cash: 0,
            upi: 0,
            card: 0,
            note: "Not tracked"
        };

        const offlinePending = 0; // Mock data

        return {
            openOrders,
            todaysSales,
            taxCollected,
            paymentSplit,
            offlinePending
        };
    }, [orders]);

    // Filter bills based on active tab
    const filteredBills = useMemo(() => {
        if (activeTab === "open") {
            return orders.filter(o =>
                o.orderStatus === 'Pending' || o.orderStatus === 'Preparing' || o.orderStatus === 'Ready'
            );
        } else {
            return orders.filter(o => o.orderStatus === 'Delivered');
        }
    }, [orders, activeTab]);

    const handleDayClose = () => {
        setShowDayCloseModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="type-h1">POS & Billing</h1>
                    <p className="type-secondary mt-1">Manage bills, payments, and daily reports</p>
                </div>
                <button
                    onClick={handleDayClose}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Day Close
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Open Orders */}
                <div className="bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Orders</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{statistics.openOrders}</p>
                </div>

                {/* Today's Sales */}
                <div className="bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Sales</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">₹{statistics.todaysSales.toFixed(2)}</p>
                </div>

                {/* Tax Collected */}
                <div className="bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Collected</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">₹{statistics.taxCollected.toFixed(2)}</p>
                </div>

                {/* Payment Split */}
                <div className="bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Split</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                        <div className="text-slate-500 italic">
                            Payment methods not tracked
                        </div>
                    </div>
                </div>

                {/* Offline Pending */}
                <div className="bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offline Pending</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{statistics.offlinePending}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("open")}
                    className={`pb-3 type-label transition-all relative text-sm ${activeTab === "open"
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    Open Orders
                    {activeTab === "open" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("recent")}
                    className={`pb-3 type-label transition-all relative text-sm ${activeTab === "recent"
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    Recent Bills
                    {activeTab === "recent" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full"></span>
                    )}
                </button>
            </div>

            {/* Bills Table */}
            {loading ? (
                <Loading message="Loading bills..." />
            ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Bill ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Table</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Payment</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                        No bills found
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.orderId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{bill.orderCode}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{bill.tableNumber}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900">₹{bill.total?.toFixed(2) || '0.00'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-500 italic">N/A</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${bill.orderStatus === 'Delivered'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {bill.orderStatus === 'Delivered' ? 'paid' : 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedBill(bill)}
                                                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                {bill.orderStatus === 'Delivered' && (
                                                    <button
                                                        onClick={() => setSelectedBill(bill)}
                                                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                        title="Print Bill"
                                                    >
                                                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bill Details Modal */}
            {selectedBill && (
                <BillDetailsModal
                    bill={selectedBill}
                    onClose={() => setSelectedBill(null)}
                />
            )}

            {/* Day Close Modal */}
            {showDayCloseModal && (
                <DayCloseModal
                    orders={orders}
                    onClose={() => setShowDayCloseModal(false)}
                />
            )}
        </div>
    );
}
