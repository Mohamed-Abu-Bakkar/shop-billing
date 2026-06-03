import { useState } from 'react';
import { Invoice } from '@/types';
import BillTemplate from './BillTemplate';
import { LoadingButton } from './ui/loading-button';

interface InvoicesPageProps {
  invoices?: Invoice[];
  onBack: () => void;
}

export default function InvoicesPage({ invoices = [], onBack }: InvoicesPageProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card">
         <LoadingButton onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</LoadingButton>
        <h1 className="heading text-base">All Invoices</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="card-surface rounded-xl">
          <div className="p-4 border-b border-border heading text-sm">All Invoices ({invoices.length})</div>
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No invoices found</div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map(inv => (
                <button key={inv.id} onClick={() => setSelectedInvoice(inv)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="mono-num font-semibold text-sm">{inv.invoiceNo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'Paid' ? 'bg-success/10 text-success' :
                        inv.status === 'Partial' ? 'bg-warning/10 text-warning' :
                        'bg-danger/10 text-danger'
                      }`}>{inv.status}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {inv.customerName || 'Walk-in Customer'}
                      {inv.buyingForClient && ` • ${inv.buyingForClient}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN')} • {inv.type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono-num font-semibold">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                    {inv.status !== 'Paid' && (
                      <div className="text-xs text-warning">
                        Due: ₹{(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <BillTemplate
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
