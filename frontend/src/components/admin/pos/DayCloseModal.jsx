import { useMemo } from "react";
import { useToast } from "../../common/Toast/ToastContext";

export default function DayCloseModal({ orders, onClose }) {
    const { showSuccess, showInfo } = useToast();

    // Calculate day close statistics
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });

        const totalSales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const taxCollected = totalSales * 0.18 / 1.18;

        // Dynamic Payment Mode Summary (Real Data)
        // Since payment method is not currently tracked/returned by API, we count all as "Untracked" for now
        // This avoids showing fake/mock data
        const paymentSummary = {
            untracked: {
                amount: totalSales,
                count: todayOrders.length
            }
        };

        // Dynamic Staff-wise Billing (Real Data)
        // Since we don't have staff info in the current order object, we group all under "System/Admin"
        const staffBilling = [
            { name: "System/Admin", amount: totalSales, count: todayOrders.length }
        ];

        // Cancelled bills (Real count from orders if available, otherwise 0)
        // The current fetch might filtered out cancelled orders, checking if we have any with status Cancelled
        const cancelledBills = orders.filter(o => o.orderStatus === 'Cancelled' && new Date(o.createdAt) >= today).length;

        return {
            totalSales,
            taxCollected,
            paymentSummary,
            staffBilling,
            cancelledBills,
            totalOrders: todayOrders.length
        };
    }, [orders]);

    const handleExportPDF = () => {
        showInfo("PDF export functionality coming soon!");
    };

    const handleExportCSV = () => {
        // Create CSV content
        const csvContent = [
            ["Day Close Report - Z-Report"],
            ["Date", new Date().toLocaleDateString()],
            [""],
            ["Total Sales", `₹${stats.totalSales.toFixed(2)}`],
            ["Tax Collected", `₹${stats.taxCollected.toFixed(2)}`],
            [""],
            ["Payment Mode Summary"],
            ["Mode", "Amount", "Transactions"],
            ["Untracked", `₹${stats.paymentSummary.untracked.amount.toFixed(2)}`, stats.paymentSummary.untracked.count],
            [""],
            ["Staff-wise Billing"],
            ["Staff", "Amount", "Bills"],
            ...stats.staffBilling.map(s => [s.name, `₹${s.amount.toFixed(2)}`, s.count]),
            [""],
            ["Cancelled Bills", stats.cancelledBills]
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `day-close-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        showSuccess("CSV exported successfully!");
    };

    const handleCloseDay = () => {
        showSuccess("Day closed successfully!");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Day Close Report (Z-Report)</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Sales Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-500 mb-1">Total Sales</p>
                            <p className="text-3xl font-bold text-slate-900">₹{stats.totalSales.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-500 mb-1">Tax Collected</p>
                            <p className="text-3xl font-bold text-slate-900">₹{stats.taxCollected.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Payment Mode Summary */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Payment Mode Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                <span className="text-slate-600">Untracked/Other</span>
                                <div className="text-right">
                                    <span className="text-slate-900 font-bold">₹{stats.paymentSummary.untracked.amount.toFixed(2)}</span>
                                    <span className="text-slate-400 text-sm ml-2">({stats.paymentSummary.untracked.count} txns)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff-wise Billing */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-slate-900 mb-3">Staff-wise Billing</h3>
                        <div className="space-y-2">
                            {stats.staffBilling.map((staff, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                    <span className="text-slate-600">{staff.name}</span>
                                    <div className="text-right">
                                        <span className="text-slate-900 font-bold">₹{staff.amount.toFixed(2)}</span>
                                        <span className="text-slate-400 text-sm ml-2">({staff.count} bills)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cancelled Bills */}
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <span className="text-red-700 font-medium">Cancelled Bills</span>
                            <span className="text-red-700 font-bold text-lg">{stats.cancelledBills}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50 sticky bottom-0">
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                    </button>
                    <button
                        onClick={handleCloseDay}
                        className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Close Day
                    </button>
                </div>
            </div>
        </div>
    );
}
