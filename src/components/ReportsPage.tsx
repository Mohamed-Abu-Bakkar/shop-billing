import { useState } from 'react';
import { useQuery } from 'convex/react';
import { Invoice, Item } from '@/types';
import { shopApi } from '@/lib/convex';
import BillTemplate from './BillTemplate';

interface ReportsPageProps {
  onBack: () => void;
}

export default function ReportsPage({ onBack }: ReportsPageProps) {
  const [tab, setTab] = useState<'daily' | 'credit' | 'profit' | 'fast' | 'dead' | 'invoices'>('daily');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const invoices = (useQuery(shopApi.listInvoices, {}) ?? []) as Invoice[];
  const items = (useQuery(shopApi.listItems, {}) ?? []) as Item[];

  const today = new Date().toDateString();
  const todayInv = invoices.filter(i => new Date(i.createdAt).toDateString() === today);
  const todaySales = todayInv.reduce((s, i) => s + i.totalAmount, 0);
  const todayCollection = todayInv.reduce((s, i) => s + i.paidAmount, 0);

  // Credit outstanding
  const creditInv = invoices.filter(i => i.status !== 'Paid');
  const totalOutstanding = creditInv.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  // Profit (simplified: retail price - purchase price)
  const todayProfit = todayInv.reduce((sum, inv) => {
    return sum + inv.items.reduce((s, bi) => {
      const item = items.find(i => i.id === bi.itemId);
      return s + (item ? (bi.price - item.purchasePrice) * bi.qty * (1 - bi.discount / 100) : 0);
    }, 0);
  }, 0);

  // Fast moving: count sales per item
  const itemSales: Record<string, number> = {};
  invoices.forEach(inv => inv.items.forEach(bi => {
    itemSales[bi.itemId] = (itemSales[bi.itemId] || 0) + bi.qty;
  }));
  const fastMoving = Object.entries(itemSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, qty]) => ({ item: items.find(i => i.id === id), qty }))
    .filter(x => x.item);

  // Dead stock
  const deadStock = items.filter(i => {
    if (!i.lastSoldAt) return i.stock > 0;
    return (Date.now() - new Date(i.lastSoldAt).getTime()) / 86400000 > 60 && i.stock > 0;
  });

  const tabs = [
    { key: 'daily', label: 'Daily Sales' },
    { key: 'invoices', label: 'All Invoices' },
    { key: 'credit', label: 'Credit' },
    { key: 'profit', label: 'Profit' },
    { key: 'fast', label: 'Fast Moving' },
    { key: 'dead', label: 'Dead Stock' },
  ] as const;

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <h1 className="heading text-base">Reports</h1>
      </div>

      <div className="px-4 py-2 flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="card-surface rounded-xl p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</div>
                <div className="mono-num text-2xl font-semibold mt-1">₹{todaySales.toLocaleString('en-IN')}</div>
              </div>
              <div className="card-surface rounded-xl p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Collected</div>
                <div className="mono-num text-2xl font-semibold text-success mt-1">₹{todayCollection.toLocaleString('en-IN')}</div>
              </div>
              <div className="card-surface rounded-xl p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Invoices</div>
                <div className="mono-num text-2xl font-semibold mt-1">{todayInv.length}</div>
              </div>
            </div>
            <div className="card-surface rounded-xl">
              <div className="p-4 border-b border-border heading text-sm">Today's Invoices</div>
              {todayInv.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No sales today</div>
              ) : (
                <div className="divide-y divide-border">
                  {todayInv.map(inv => (
                    <div key={inv.id} className="px-4 py-2.5 flex justify-between text-sm">
                      <div>
                        <span className="mono-num text-xs text-muted-foreground">{inv.invoiceNo}</span>
                        <span className="ml-2">{inv.customerName || 'Walk-in'}</span>
                      </div>
                      <span className="mono-num font-semibold">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'invoices' && (
          <div className="space-y-4">
            <div className="card-surface rounded-xl">
              <div className="p-4 border-b border-border heading text-sm">All Invoices ({invoices.length})</div>
              {invoices.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No invoices found</div>
              ) : (
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
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
        )}

        {tab === 'credit' && (
          <div className="space-y-4">
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Outstanding</div>
              <div className="mono-num text-2xl font-semibold text-warning mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            </div>
            <div className="card-surface rounded-xl divide-y divide-border">
              {creditInv.map(inv => (
                <div key={inv.id} className="px-4 py-2.5 flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{inv.customerName || 'Unknown'}</span>
                    <span className="mono-num text-xs text-muted-foreground ml-2">{inv.invoiceNo}</span>
                  </div>
                  <span className="mono-num font-semibold text-warning">₹{(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {creditInv.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No pending credit</div>}
            </div>
          </div>
        )}

        {tab === 'profit' && (
          <div className="card-surface rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Today's Estimated Profit</div>
            <div className="mono-num text-3xl font-semibold text-success mt-2">₹{todayProfit.toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground mt-2">Based on purchase vs selling price difference</div>
          </div>
        )}

        {tab === 'fast' && (
          <div className="card-surface rounded-xl">
            <div className="p-4 border-b border-border heading text-sm">Top Selling Items</div>
            <div className="divide-y divide-border">
              {fastMoving.map(({ item, qty }, i) => (
                <div key={item!.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="mono-num text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="font-medium">{item!.name}</span>
                    <span className="text-xs text-muted-foreground">{item!.brand}</span>
                  </div>
                  <span className="mono-num font-semibold">{qty} sold</span>
                </div>
              ))}
              {fastMoving.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No sales data</div>}
            </div>
          </div>
        )}

        {tab === 'dead' && (
          <div className="card-surface rounded-xl">
            <div className="p-4 border-b border-border heading text-sm">Dead Stock (No sales in 60+ days)</div>
            <div className="divide-y divide-border">
              {deadStock.map(item => (
                <div key={item.id} className="px-4 py-2.5 flex items-center justify-between text-sm border-l-4 border-l-warning">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{item.brand}</span>
                  </div>
                  <div className="text-right">
                    <span className="mono-num">{item.stock} {item.unit}</span>
                    <span className="text-xs text-muted-foreground ml-2">₹{(item.retailPrice * item.stock).toLocaleString('en-IN')} value</span>
                  </div>
                </div>
              ))}
              {deadStock.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No dead stock items</div>}
            </div>
          </div>
        )}
      </div>

      {/* Bill Template Modal */}
      {selectedInvoice && (
        <BillTemplate
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
