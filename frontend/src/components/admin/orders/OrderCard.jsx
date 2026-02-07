import { useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { useToast } from "../../common/Toast/ToastContext";

export default function OrderCard({ order, onUpdate }) {
    const { showSuccess, showError } = useToast();
    const [updating, setUpdating] = useState(false);

    const statusColors = {
        Pending: "bg-amber-100 text-amber-700 border-amber-200",
        Preparing: "bg-blue-100 text-blue-700 border-blue-200",
        Ready: "bg-green-100 text-green-700 border-green-200",
        Delivered: "bg-slate-100 text-slate-700 border-slate-200",
        Completed: "bg-slate-100 text-slate-700 border-slate-200",
    };

    const nextStatusMap = {
        Pending: "Preparing",
        Preparing: "Ready",
        Ready: "Completed",
    };

    const buttonColors = {
        Pending: "bg-amber-500 hover:bg-amber-600",
        Preparing: "bg-blue-500 hover:bg-blue-600",
        Ready: "bg-green-600 hover:bg-green-700",
    };

    const handleStatusUpdate = async () => {
        const nextStatus = nextStatusMap[order.orderStatus];
        if (!nextStatus) return;

        try {
            setUpdating(true);
            // Reuse KDS endpoint
            await axiosClient.patch(`/kds/${order.orderCode}/status`, {
                status: nextStatus
            });
            showSuccess(`Order marked as ${nextStatus}`);
            onUpdate();
        } catch (error) {
            showError(error.response?.data?.message || "Failed to update order status");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs text-slate-500 font-medium">Table</span>
                    <p className="text-xl font-bold text-slate-900">{order.tableNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${statusColors[order.orderStatus] || 'bg-slate-100 text-slate-700'}`}>
                    {order.orderStatus}
                </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">Order:</span>
                <span className="text-xs font-semibold text-slate-700">{order.orderCode}</span>
            </div>

            <p className="text-[10px] text-slate-400 mb-3">
                {new Date(order.createdAt).toLocaleString()}
            </p>

            {/* Items */}
            <div className="space-y-1.5 mb-3 border-t border-slate-100 pt-3">
                {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            x{item.quantity}
                        </span>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-100 mb-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Total</span>
                    <span className="text-xl font-bold text-slate-900">₹{order.total || 0}</span>
                </div>
            </div>

            {/* Action Button */}
            {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Completed' && nextStatusMap[order.orderStatus] && (
                <button
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    className={`w-full py-2.5 text-white rounded-lg text-sm font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${buttonColors[order.orderStatus] || 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {updating ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                        </span>
                    ) : (
                        `Mark as ${nextStatusMap[order.orderStatus] === 'Completed' ? 'Delivered' : nextStatusMap[order.orderStatus]}`
                    )}
                </button>
            )}
        </div>
    );
}
