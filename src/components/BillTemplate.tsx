import { Invoice, Item } from '@/types';
import { useQuery } from 'convex/react';
import { shopApi } from '@/lib/convex';

interface BillTemplateProps {
  invoice: Invoice;
  onClose: () => void;
  type?: 'bill' | 'quotation';
}

export default function BillTemplate({ invoice, onClose, type = 'bill' }: BillTemplateProps) {
  const items = (useQuery(shopApi.listItems, {}) ?? []) as Item[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('bill-template');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px; 
              line-height: 1.3; 
              color: black; 
              background: white;
              padding: 10px;
            }
            @page { 
              margin: 0; 
              size: 80mm auto;
            }
            h1 { font-size: 16px; font-weight: bold; }
            h2 { font-size: 13px; font-weight: bold; }
            .text-xl { font-size: 13px; }
            .text-lg { font-size: 11px; }
            .text-sm { font-size: 10px; }
            .text-xs { font-size: 9px; }
            .text-2xl { font-size: 18px; }
            .font-bold { font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-red-600 { color: #dc2626; }
            .text-green-600 { color: #16a34a; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-800 { color: #1f2937; }
            .border-t-4 { border-top: 4px solid #1f2937; }
            .border-t { border-top: 1px solid #1f2937; }
            .border-gray-800 { border-color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            th, td { padding: 3px 4px; border: 1px solid #000; text-align: left; }
            th { background: #f5f5f5; }
            .border-b-2 { border-bottom: 2px solid #000; }
            .mb-2 { margin-bottom: 6px; }
            .mb-4 { margin-bottom: 12px; }
            .mb-6 { margin-bottom: 18px; }
            .py-1 { padding-top: 2px; padding-bottom: 2px; }
            .py-2 { padding-top: 4px; padding-bottom: 4px; }
            .pt-3 { padding-top: 8px; }
            .ml-auto { margin-left: auto; }
            .w-40 { width: 140px; }
            .flex { display: flex; }
            .justify-content-flex-end { justify-content: flex-end; }
            .justify-between { justify-content: space-between; }
            .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .gap-4 { gap: 12px; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        {/* Print Template */}
        <div id="bill-template" className="p-8">
          {/* Header */}
          <div className="border-b-4 border-primary pb-6 mb-6">
            <div className="flex justify-between items-start">
              {type === 'bill' && (
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">Sri Mahalingam Electricals</h1>
                  <p className="text-lg text-gray-600 mb-1">Electrical & Plumbing Store</p>
                  <p className="text-sm text-gray-500">GSTIN: 33ADWPJ5940P1ZR</p>
                  <p className="text-sm text-gray-500">Phone: 99421 94751</p>
                  <p className="text-sm text-gray-500">Email: jaimaha772@gmail.com</p>
                </div>
              )}
              {type === 'quotation' && (
                <div>
                  {/* <h1 className="text-3xl font-bold text-primary mb-2">QUOTATION</h1> */}
                  <p className="text-lg text-gray-600 mb-1">Electrical Materials Estimate</p>
                </div>
              )}
              <div className="text-right">
                <div className="text-4xl font-bold text-primary mb-2">
                  {type === 'quotation' ? 'QUOTATION' : invoice.invoiceNo}
                </div>
                <div className="text-sm text-gray-600">
                  <div>Date: {formatDate(invoice.createdAt)}</div>
                  <div>Type: <span className="font-semibold">{invoice.type}</span></div>
                  {type === 'bill' && (
                    <div>Status: <span className={`font-semibold ${invoice.status === 'Paid' ? 'text-green-600' : invoice.status === 'Partial' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {invoice.status}
                    </span></div>
                  )}
                  {/* {type === 'quotation' && (
                    <div className="text-blue-600 font-semibold">Valid for 30 days</div>
                  )} */}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
                    <div className="border-t border-gray-300 pt-6">

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Bill To:</h3>
              <div className="space-y-1">
                {invoice.customerName ? (
                  <>
                    <p className="font-semibold text-gray-900">{invoice.customerName}</p>
                    {type === 'bill' && invoice.customerId && (
                      <p className="text-sm text-gray-600">
                        Customer ID: {invoice.customerId}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-semibold text-gray-900">Walk-in Customer</p>
                )}
                {invoice.buyingForClient && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Client:</span> {invoice.buyingForClient}
                  </p>
                )}
              </div>
            </div>
            <div>
              {type === 'bill' ? (
                <>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Payment Details:</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Method:</span> {invoice.paymentMethod}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Paid:</span> {formatCurrency(invoice.paidAmount)}
                    </p>
                    {invoice.status !== 'Paid' && (
                      <p className="text-sm text-red-600 font-medium">
                        Due: {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                </>
              )}
            </div>
          </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">S.No</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Item Description</th>
                  <th className="border border-gray-300 px-2 py-1 text-center text-xs font-semibold">Qty</th>
                  <th className="border border-gray-300 px-2 py-1 text-center text-xs font-semibold">Unit</th>
                  <th className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold">Rate</th>
                  <th className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold">Disc</th>
                  <th className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const itemDetails = items.find(i => i.id === item.itemId);
                  const discountAmount = (item.price * item.qty * item.discount) / 100;
                  const itemTotal = (item.price * item.qty) - discountAmount;

                  return (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">{index + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {itemDetails && (
                            <div className="text-sm text-gray-500">
                              Brand: {itemDetails.brand} | Category: {itemDetails.category}
                              {item.warrantyExpiry && (
                                <span className="ml-2 text-blue-600">
                                  Warranty: {formatDate(item.warrantyExpiry)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{item.qty}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">{itemDetails?.unit || 'pc'}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.price)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">
                        {item.discount > 0 ? `${item.discount}% (${formatCurrency(discountAmount)})` : '-'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-semibold">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mb-6" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 160 }}>
              <div style={{ borderTop: '4px solid #1f2937', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2 }}>
                  <span style={{ color: '#4b5563' }}>Subtotal</span>
                  <span>{formatCurrency(invoice.totalAmount + (invoice.items.reduce((sum, item) => sum + (item.price * item.qty * item.discount / 100), 0)))}</span>
                </div>
                {invoice.items.some(item => item.discount > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2, color: '#dc2626' }}>
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.items.reduce((sum, item) => sum + (item.price * item.qty * item.discount / 100), 0))}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4, fontWeight: 'bold', fontSize: 20, borderTop: '1px solid #1f2937', marginTop: 4 }}>
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {type === 'bill' && invoice.paidAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2, color: '#16a34a' }}>
                    <span>Paid</span>
                    <span>{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                )}
                {type === 'bill' && invoice.totalAmount > invoice.paidAmount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2, color: '#dc2626', fontWeight: 600 }}>
                    <span>Due</span>
                    <span>{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {type === 'quotation' && (
            <div className="text-center text-sm text-blue-600 font-medium mt-2 pt-2 border-t border-gray-300">
              This is an estimate only. Final prices may vary based on market conditions.
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6">
            <div className="grid grid-cols-2 gap-8 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
                <ul className="space-y-1 text-xs">
                  {type === 'bill' ? (
                    <>
                      <li>• Goods once sold will not be taken back</li>
                      <li>• Warranty as per manufacturer terms</li>
                      <li>• Payment due within 30 days for credit customers</li>
                      {/* <li>• Subject to local jurisdiction</li> */}
                    </>
                  ) : (
                    <>
                      <li>• This is an estimate only, not a firm quotation</li>
                      <li>• Prices are subject to change based on market conditions</li>
                      <li>• Final prices will be confirmed at the time of purchase</li>
                      <li>• Estimate valid for 30 days from issue date</li>
                      <li>• Subject to material availability</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="text-right">
                {/* <div className="mb-8">
                  <div className="border-b border-gray-400 w-48 ml-auto mb-2"></div>
                  <p className="text-sm">Authorized Signature</p>
                </div> */}
                <div className="text-xs text-gray-500">
                  {/* <p>Generated by VoltLedger v1.0</p> */}
                  <p>{type === 'quotation' ? 'We look forward to serving you!' : 'Thank you for your business!'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden in print */}
        <div className="print:hidden bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <div className="space-x-2">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Print Bill
            </button>
            {/* <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  const billContent = document.getElementById('bill-template')?.innerHTML || '';
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Invoice ${invoice.invoiceNo}</title>
                        <style>
                          @page { margin: 0.5in; size: A4; }
                          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: black; background: white; }
                          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                          th, td { border: 1px solid #000; padding: 0.5rem; text-align: left; }
                          th { background: #f5f5f5; font-weight: bold; }
                          .text-right { text-align: right; }
                          .text-center { text-align: center; }
                          .font-bold { font-weight: bold; }
                          .border-b-2 { border-bottom: 2px solid #000; }
                          .pb-6 { padding-bottom: 1.5rem; }
                          .mb-6 { margin-bottom: 1.5rem; }
                          .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                          .text-3xl { font-size: 1.875rem; }
                          .text-4xl { font-size: 2.25rem; }
                        </style>
                      </head>
                      <body>
                        ${billContent}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Print to PDF
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
