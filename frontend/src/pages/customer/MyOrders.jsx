import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantProvider";
import { useMenuTheme } from "../../hooks/useMenuTheme";

const STATUS_STYLES = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-400", label: "Pending" },
    preparing: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400", label: "Preparing" },
    ready: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", label: "Ready 🎉" },
    completed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400", label: "Completed" },
};

function getStatusStyle(status) {
    return STATUS_STYLES[status?.toLowerCase()] || {
        bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200",
        dot: "bg-slate-400", label: status || "Unknown",
    };
}

function formatTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " · " + d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function MyOrders() {
    const { slug } = useTenant();
    const navigate = useNavigate();
    useMenuTheme(slug);

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!slug) return;
        try {
            const raw = localStorage.getItem(`armenu_orders_${slug}`);
            setOrders(raw ? JSON.parse(raw) : []);
        } catch {
            setOrders([]);
        }
    }, [slug]);

    return (
        <div
            className="min-h-screen min-h-dvh"
            style={{ background: "var(--menu-bg)", color: "var(--menu-secondary)", fontFamily: "var(--menu-font)" }}
        >
            {/* ── Header ── */}
            <div
                className="backdrop-blur-md border-b sticky top-0 z-30 shadow-sm"
                style={{ background: "var(--menu-bg)", borderColor: "var(--menu-accent)", opacity: 0.98 }}
            >
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors active:scale-95"
                        aria-label="Go back"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1
                            className="text-xl font-black tracking-tight"
                            style={{ color: "var(--menu-secondary)" }}
                        >
                            My Orders
                        </h1>
                        <p className="text-xs font-bold text-slate-400">Orders placed from this device</p>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-2xl mx-auto px-4 py-6">

                {orders.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-2 border border-amber-100">
                            <span className="text-4xl">🧾</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-700">No orders yet</h2>
                        <p className="text-sm font-medium text-slate-400 max-w-xs">
                            When you place an order, it will appear here so you can track it any time.
                        </p>
                        <button
                            onClick={() => navigate(`/r/${slug}/menu`)}
                            className="mt-4 px-6 py-3 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 border"
                            style={{
                                background: "var(--menu-primary)",
                                color: "var(--menu-primary-text)",
                                borderColor: "var(--menu-primary)",
                            }}
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    /* ── Orders List ── */
                    <div className="flex flex-col gap-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            {orders.length} order{orders.length !== 1 ? "s" : ""} found
                        </p>

                        {orders.map((order) => {
                            const style = getStatusStyle(order.orderStatus);
                            return (
                                <div
                                    key={order.orderCode}
                                    className="bg-white rounded-[1.75rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4 flex justify-between items-center text-white">
                                        <div>
                                            <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">Order Code</p>
                                            <p className="text-2xl font-black tabular-nums tracking-tight">{order.orderCode}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">Table</p>
                                            <p className="text-2xl font-black">{order.tableNumber}</p>
                                        </div>
                                    </div>

                                    {/* Status Row */}
                                    <div className={`px-5 py-3 border-b border-slate-50 flex items-center justify-between ${style.bg}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                                            <span className={`text-xs font-black uppercase tracking-widest ${style.text}`}>
                                                {style.label}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{formatTime(order.placedAt)}</span>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="px-5 py-3 space-y-1">
                                        {(order.orderItems || []).slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-700 truncate max-w-[65%]">
                                                    {item.quantity}× {item.name}
                                                </span>
                                                <span className="text-sm font-black text-slate-500">
                                                    ₹{item.lineTotal ?? (item.quantity * (item.price || 0))}
                                                </span>
                                            </div>
                                        ))}
                                        {order.orderItems?.length > 3 && (
                                            <p className="text-xs font-bold text-slate-400 mt-1">
                                                +{order.orderItems.length - 3} more item{order.orderItems.length - 3 !== 1 ? "s" : ""}
                                            </p>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-4 border-t border-dashed border-slate-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Paid</span>
                                            <span className="text-xl font-black text-slate-800">₹{order.total}</span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/r/${slug}/track-order?code=${order.orderCode}`)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 border"
                                            style={{
                                                background: "var(--menu-primary)",
                                                color: "var(--menu-primary-text)",
                                                borderColor: "var(--menu-primary)",
                                            }}
                                        >
                                            Track Order
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Bottom Action */}
                        <button
                            onClick={() => navigate(`/r/${slug}/menu`)}
                            className="mt-2 w-full py-4 rounded-2xl text-sm font-black border border-slate-100 bg-white text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm active:scale-95"
                        >
                            Back to Menu
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
