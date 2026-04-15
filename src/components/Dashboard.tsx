import { useQuery } from 'convex/react';
import { Invoice } from '@/types';
import { shopApi } from '@/lib/convex';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const invoices = (useQuery(shopApi.listInvoices, {}) ?? []) as Invoice[];
  const customerCount = ((useQuery(shopApi.listCustomers, {}) ?? []) as unknown[]).length;
  const itemCount = ((useQuery(shopApi.listItems, {}) ?? []) as unknown[]).length;

  const today = new Date().toDateString();
  const todayInvoices = invoices.filter(i => new Date(i.createdAt).toDateString() === today);
  const todayCollection = todayInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalCredit = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-slide-in">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigate('billing')}
          className="rounded-xl p-4 md:p-6 text-left hover:shadow-md transition-shadow group cursor-pointer"
          style={{ background: 'hsl(var(--accent))', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="text-accent-foreground font-semibold text-lg">New Bill</div>
          <div className="text-accent-foreground/70 text-xs mt-1">Press <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/20 text-accent-foreground border border-white/30">N</kbd></div>
        </button>
        <button onClick={() => onNavigate('customers')} className="card-surface rounded-xl p-4 md:p-6 text-left hover:shadow-md transition-shadow cursor-pointer">
          <div className="heading text-sm">Customers</div>
          <div className="mono-num text-2xl font-semibold mt-1">{customerCount}</div>
        </button>
        <button onClick={() => onNavigate('inventory')} className="card-surface rounded-xl p-4 md:p-6 text-left hover:shadow-md transition-shadow cursor-pointer">
          <div className="heading text-sm">Items</div>
          <div className="mono-num text-2xl font-semibold mt-1">{itemCount}</div>
        </button>
        <button onClick={() => onNavigate('payments')} className="card-surface rounded-xl p-4 md:p-6 text-left hover:shadow-md transition-shadow cursor-pointer">
          <div className="heading text-sm">Payments</div>
          <div className="text-muted-foreground text-xs mt-1">Record & track</div>
        </button>
        <button onClick={() => onNavigate('reports')} className="card-surface rounded-xl p-4 md:p-6 text-left hover:shadow-md transition-shadow cursor-pointer">
          <div className="heading text-sm">Reports</div>
          <div className="text-muted-foreground text-xs mt-1">Sales & Stock</div>
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-surface rounded-xl p-4">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Today's Collection</div>
          <div className="mono-num text-2xl font-semibold text-success mt-1">₹{todayCollection.toLocaleString('en-IN')}</div>
          <div className="text-muted-foreground text-xs mt-1">{todayInvoices.length} invoices</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Pending Credit</div>
          <div className="mono-num text-2xl font-semibold text-warning mt-1">₹{totalCredit.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card-surface rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="heading text-sm">Recent Invoices</h2>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No invoices yet. Create your first bill!</div>
        ) : (
          <div className="divide-y divide-border">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="mono-num text-muted-foreground text-xs">{inv.invoiceNo}</span>
                  <span className="font-medium">{inv.customerName || 'Walk-in'}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${inv.type === 'Retail' ? 'bg-muted text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                    {inv.type}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    inv.status === 'Paid' ? 'bg-success/10 text-success' :
                    inv.status === 'Partial' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger'
                  }`}>{inv.status}</span>
                  <span className="mono-num font-semibold">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
