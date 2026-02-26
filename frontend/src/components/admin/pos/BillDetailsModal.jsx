import { useToast } from "../../common/Toast/ToastContext";
import Modal from "../../common/Modal";
import { printBill } from "../../../utils/printUtils";

export default function BillDetailsModal({ bill, onClose }) {
    const { showSuccess } = useToast();

    if (!bill) return null;

    const handlePrint = () => {
        printBill(bill);
        showSuccess("Printing bill...");
    };

    const subtotal = bill.subtotal || (bill.total / 1.18);
    const tax = bill.taxAmount || (bill.total - subtotal);

    return (
        <Modal title="Bill Details" onClose={onClose} size="md">
            {/* Bill Info */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Bill ID:</span>
                    <span className="font-semibold text-slate-900">{bill.orderCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Table:</span>
                    <span className="font-semibold text-slate-900">{bill.tableNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-900">{new Date(bill.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status:</span>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${bill.orderStatus === 'Delivered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}>
                        {bill.orderStatus === 'Delivered' ? 'Paid' : 'Pending'}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Items</h3>
                <div className="space-y-2">
                    {bill.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-700">{item.name} x${item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax (18%):</span>
                    <span className="font-semibold text-slate-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
                    <span className="text-slate-900">Total:</span>
                    <span className="text-slate-900">₹{bill.total?.toFixed(2) || '0.00'}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                    Close
                </button>
                {bill.orderStatus === 'Delivered' && (
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Bill
                    </button>
                )}
            </div>
        </Modal>
    );
}
