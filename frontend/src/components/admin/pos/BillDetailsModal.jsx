import { useToast } from "../../common/Toast/ToastContext";

export default function BillDetailsModal({ bill, onClose }) {
    const { showSuccess } = useToast();

    if (!bill) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill - ${bill.orderCode}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        max-width: 300px;
                        margin: 20px auto;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px dashed #000;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                    }
                    .bill-info {
                        margin: 10px 0;
                        font-size: 12px;
                    }
                    .items {
                        margin: 15px 0;
                        border-top: 1px dashed #000;
                        border-bottom: 1px dashed #000;
                        padding: 10px 0;
                    }
                    .item {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                        font-size: 12px;
                    }
                    .totals {
                        margin: 10px 0;
                        font-size: 12px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .total-row.grand {
                        font-weight: bold;
                        font-size: 14px;
                        border-top: 2px solid #000;
                        padding-top: 5px;
                        margin-top: 10px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 2px dashed #000;
                        padding-top: 10px;
                        font-size: 11px;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0;">RESTAURANT BILL</h2>
                    <p style="margin: 5px 0;">Thank you for dining with us!</p>
                </div>
                
                <div class="bill-info">
                    <div><strong>Bill ID:</strong> ${bill.orderCode}</div>
                    <div><strong>Table:</strong> ${bill.tableNumber}</div>
                    <div><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleString()}</div>
                </div>
                
                <div class="items">
                    <div style="font-weight: bold; margin-bottom: 10px;">ITEMS</div>
                    ${bill.items.map(item => `
                        <div class="item">
                            <span>${item.name} x${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>₹${(bill.total / 1.18).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (18%):</span>
                        <span>₹${(bill.total * 0.18 / 1.18).toFixed(2)}</span>
                    </div>
                    <div class="total-row grand">
                        <span>TOTAL:</span>
                        <span>₹${bill.total?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Visit Again!</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);

        showSuccess("Printing bill...");
    };

    const subtotal = bill.total / 1.18;
    const tax = bill.total * 0.18 / 1.18;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Bill Details</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Bill Info */}
                <div className="p-4 space-y-3">
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
                <div className="p-4 border-t border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Items</h3>
                    <div className="space-y-2">
                        {bill.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-700">{item.name} x{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totals */}
                <div className="p-4 border-t border-slate-200 space-y-2">
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
                <div className="p-4 border-t border-slate-200 flex gap-3">
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
            </div>
        </div>
    );
}
