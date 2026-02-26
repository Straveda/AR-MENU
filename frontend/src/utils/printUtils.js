export const printBill = (bill) => {
    if (!bill) return;

    const printWindow = window.open('', '_blank');
    const subtotal = bill.subtotal || (bill.total / 1.18);
    const tax = bill.taxAmount || (bill.total - subtotal);

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
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Tax (18%):</span>
                    <span>₹${tax.toFixed(2)}</span>
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
};
