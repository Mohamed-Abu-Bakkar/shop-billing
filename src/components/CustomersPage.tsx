import { useState, useEffect } from 'react';
import { Customer, BehaviorScore } from '@/types';
import { getCustomers, addCustomer, updateCustomer, getInvoices, generateId } from '@/lib/store';
import { toast } from 'sonner';

interface CustomersPageProps {
  onBack: () => void;
}

export default function CustomersPage({ onBack }: CustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  const reload = () => setCustomers(getCustomers());
  useEffect(reload, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleSave = (c: Customer) => {
    if (editCust) { updateCustomer(c); toast.success('Customer updated'); }
    else { addCustomer(c); toast.success('Customer added'); }
    reload();
    setShowForm(false);
    setEditCust(null);
  };

  const invoices = getInvoices();
  const custInvoices = selectedCust ? invoices.filter(i => i.customerId === selectedCust.id) : [];

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={selectedCust ? () => setSelectedCust(null) : onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          <h1 className="heading text-base">{selectedCust ? selectedCust.name : 'Customers'}</h1>
        </div>
        {!selectedCust && (
          <button onClick={() => { setEditCust(null); setShowForm(true); }} className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
            + Add Customer
          </button>
        )}
      </div>

      {selectedCust ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Credit</div>
              <div className="mono-num text-xl font-semibold text-warning mt-1">₹{selectedCust.totalCredit.toLocaleString('en-IN')}</div>
            </div>
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</div>
              <div className="mono-num text-xl font-semibold text-success mt-1">₹{selectedCust.totalPaid.toLocaleString('en-IN')}</div>
            </div>
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Behavior</div>
              <div className={`text-xl font-semibold mt-1 ${
                selectedCust.behaviorScore === 'Good' ? 'text-success' :
                selectedCust.behaviorScore === 'Late' ? 'text-warning' :
                selectedCust.behaviorScore === 'Risky' ? 'text-danger' : 'text-foreground'
              }`}>{selectedCust.behaviorScore}</div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="card-surface rounded-xl">
            <div className="p-4 border-b border-border">
              <h2 className="heading text-sm">Transaction History</h2>
            </div>
            {custInvoices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet</div>
            ) : (
              <div className="divide-y divide-border">
                {custInvoices.map(inv => (
                  <div key={inv.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="mono-num text-xs text-muted-foreground">{inv.invoiceNo}</span>
                      <span className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</span>
                      {inv.buyingForClient && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                          For: {inv.buyingForClient}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        inv.status === 'Paid' ? 'bg-success/10 text-success' :
                        inv.status === 'Partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                      }`}>{inv.status}</span>
                      <span className="mono-num font-semibold">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 border-b border-border">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
              className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedCust(c)}
                className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{c.phone}</span>
                    {c.isElectrician && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">Electrician</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    c.behaviorScore === 'Good' ? 'bg-success/10 text-success' :
                    c.behaviorScore === 'Late' ? 'bg-warning/10 text-warning' :
                    c.behaviorScore === 'Risky' ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'
                  }`}>{c.behaviorScore}</span>
                  <span className="mono-num font-semibold text-warning">₹{c.totalCredit.toLocaleString('en-IN')}</span>
                  <button onClick={e => { e.stopPropagation(); setEditCust(c); setShowForm(true); }} className="text-accent text-xs hover:underline">Edit</button>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No customers found</div>}
          </div>
        </>
      )}

      {showForm && <CustomerForm customer={editCust} onSave={handleSave} onClose={() => { setShowForm(false); setEditCust(null); }} />}
    </div>
  );
}

function CustomerForm({ customer, onSave, onClose }: { customer: Customer | null; onSave: (c: Customer) => void; onClose: () => void }) {
  const [form, setForm] = useState<Customer>(customer || {
    id: generateId(), name: '', phone: '', isElectrician: false,
    creditLimit: 50000, totalCredit: 0, totalPaid: 0, behaviorScore: 'Good',
  });
  const set = (k: keyof Customer, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-elevated rounded-xl w-full max-w-md p-5 space-y-4 bg-card" onClick={e => e.stopPropagation()}>
        <h2 className="heading text-base">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
        <div className="space-y-3">
          <input placeholder="Customer name *" value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <input placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isElectrician} onChange={e => set('isElectrician', e.target.checked)} id="isElec" />
            <label htmlFor="isElec" className="text-sm">Electrician</label>
          </div>
          <input type="number" placeholder="Credit limit ₹" value={form.creditLimit || ''} onChange={e => set('creditLimit', +e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <select value={form.behaviorScore} onChange={e => set('behaviorScore', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent">
            {(['Good', 'Regular', 'Late', 'Risky'] as BehaviorScore[]).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground">Cancel</button>
          <button onClick={() => { if (!form.name) { toast.error('Name required'); return; } onSave(form); }}
            className="px-4 py-2 rounded-lg text-sm bg-accent text-accent-foreground font-medium">
            {customer ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
