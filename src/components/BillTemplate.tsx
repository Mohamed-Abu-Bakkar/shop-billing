import { Invoice, Item } from '@/types';
import { getItems } from '@/lib/store';

interface BillTemplateProps {
  invoice: Invoice;
  onClose: () => void;
  type?: 'bill' | 'quotation';
}

export default function BillTemplate({ invoice, onClose, type = 'bill' }: BillTemplateProps) {
  const items = getItems();

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
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        {/* Print Template */}
        <div id="bill-template" className="p-8 print:p-4 print:shadow-none print:max-w-none">
          {/* Header */}
          <div className="border-b-4 border-primary pb-6 mb-6 print:border-b-2">
            <div className="flex justify-between items-start">
              {type === 'bill' && (
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">Sri Mahalingam Electricals</h1>
                  <p className="text-lg text-gray-600 mb-1">Electrical & Hardware Store</p>
                  <p className="text-sm text-gray-500">GSTIN: 33ADWPJ5940P1ZR</p>
                  <p className="text-sm text-gray-500">Phone: 99421 94751</p>
                  <p className="text-sm text-gray-500">Email: jaimaha772@gmail.com</p>
                </div>
              )}
              {type === 'quotation' && (
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">QUOTATION</h1>
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

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">S.No</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Item Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Unit</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Rate</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Discount</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const itemDetails = items.find(i => i.id === item.itemId);
                  const discountAmount = (item.price * item.qty * item.discount) / 100;
                  const itemTotal = (item.price * item.qty) - discountAmount;

                  return (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-center">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-3">
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
                      <td className="border border-gray-300 px-4 py-3 text-center">{item.qty}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">{itemDetails?.unit || 'pc'}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {item.discount > 0 ? `${item.discount}% (${formatCurrency(discountAmount)})` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-80">
              <div className="border-t-2 border-gray-300 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Subtotal:</span>
                  <span>{formatCurrency(invoice.totalAmount + (invoice.items.reduce((sum, item) => sum + (item.price * item.qty * item.discount / 100), 0)))}</span>
                </div>
                {invoice.items.some(item => item.discount > 0) && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-semibold">Total Discount:</span>
                    <span>-{formatCurrency(invoice.items.reduce((sum, item) => sum + (item.price * item.qty * item.discount / 100), 0))}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>{type === 'quotation' ? 'Estimated Total:' : 'Total Amount:'}</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {type === 'bill' && (
                  <>
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Amount Paid:</span>
                      <span>{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                    {invoice.totalAmount > invoice.paidAmount && (
                      <div className="flex justify-between text-red-600 font-semibold border-t border-gray-300 pt-2">
                        <span>Balance Due:</span>
                        <span>{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</span>
                      </div>
                    )}
                  </>
                )}
                {type === 'quotation' && (
                  <div className="text-center text-sm text-blue-600 font-medium mt-2 pt-2 border-t border-gray-300">
                    This is an estimate only. Final prices may vary based on market conditions.
                  </div>
                )}
              </div>
            </div>
          </div>

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
            <button
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}