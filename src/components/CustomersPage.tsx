import { useState, useEffect } from 'react';
import { Customer, BehaviorScore, Client, Invoice } from '@/types';
import { getCustomers, addCustomer, updateCustomer, getInvoices, generateId, getClientsByCustomer, addClient, deleteClient, addPayment, updateInvoice } from '@/lib/store';
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
  const [activeTab, setActiveTab] = useState<'history' | 'clients' | 'payments'>('history');

  const reload = () => {
    const custs = getCustomers();
    setCustomers(custs);
    if (selectedCust) {
      setSelectedCust(custs.find(c => c.id === selectedCust.id) || null);
    }
  };
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
  const unpaidInvoices = custInvoices.filter(i => i.status !== 'Paid');

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={selectedCust ? () => { setSelectedCust(null); setActiveTab('history'); } : onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
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

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['history', ...(selectedCust.isElectrician ? ['clients'] : []), 'payments'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors capitalize ${activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab === 'history' ? 'Transactions' : tab === 'clients' ? 'Clients' : 'Pay Credit'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'history' && (
            <TransactionHistory invoices={custInvoices} />
          )}

          {activeTab === 'clients' && selectedCust.isElectrician && (
            <ClientManager customerId={selectedCust.id} />
          )}

          {activeTab === 'payments' && (
            <CreditPayment customer={selectedCust} unpaidInvoices={unpaidInvoices} onPaymentDone={reload} />
          )}
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

// ─── Transaction History ───
function TransactionHistory({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="card-surface rounded-xl">
      <div className="p-4 border-b border-border">
        <h2 className="heading text-sm">Transaction History</h2>
      </div>
      {invoices.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet</div>
      ) : (
        <div className="divide-y divide-border">
          {invoices.map(inv => (
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
  );
}

// ─── Client Manager ───
function ClientManager({ customerId }: { customerId: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const reload = () => setClients(getClientsByCustomer(customerId));
  useEffect(reload, [customerId]);

  const handleAdd = () => {
    if (!name.trim()) { toast.error('Client name required'); return; }
    addClient({ id: generateId(), customerId, name: name.trim(), phone: phone.trim(), address: address.trim(), createdAt: new Date().toISOString() });
    toast.success(`Client "${name}" added`);
    setName(''); setPhone(''); setAddress(''); setShowAdd(false);
    reload();
  };

  const handleDelete = (id: string, clientName: string) => {
    deleteClient(id);
    toast.success(`Client "${clientName}" removed`);
    reload();
  };

  return (
    <div className="card-surface rounded-xl">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="heading text-sm">Clients (buying for)</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
          + Add Client
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border space-y-2 bg-muted/30">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Client name *"
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)"
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address / Project details"
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-md text-xs bg-muted text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} className="px-3 py-1.5 rounded-md text-xs bg-accent text-accent-foreground font-medium">Add</button>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No clients added yet</div>
      ) : (
        <div className="divide-y divide-border">
          {clients.map(cl => (
            <div key={cl.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{cl.name}</span>
                {cl.phone && <span className="text-muted-foreground text-xs ml-2">{cl.phone}</span>}
                {cl.address && <span className="text-muted-foreground text-xs ml-2">· {cl.address}</span>}
              </div>
              <button onClick={() => handleDelete(cl.id, cl.name)} className="text-danger text-xs hover:underline">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Credit Payment for Old Bills ───
function CreditPayment({ customer, unpaidInvoices, onPaymentDone }: {
  customer: Customer;
  unpaidInvoices: Invoice[];
  onPaymentDone: () => void;
}) {
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Mixed'>('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedInv = unpaidInvoices.find(i => i.id === selectedInvId);
  const remaining = selectedInv ? selectedInv.totalAmount - selectedInv.paidAmount : 0;

  const handlePay = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) { toast.error('Enter valid amount'); return; }
    if (!paymentDate) { toast.error('Select a date'); return; }

    if (selectedInv) {
      // Pay against specific invoice
      const newPaid = selectedInv.paidAmount + a;
      const newStatus = newPaid >= selectedInv.totalAmount ? 'Paid' : 'Partial';
      updateInvoice({ ...selectedInv, paidAmount: Math.min(newPaid, selectedInv.totalAmount), status: newStatus });

      addPayment({
        id: generateId(), customerId: customer.id, customerName: customer.name,
        amount: a, method, invoiceId: selectedInv.id, createdAt: new Date(paymentDate).toISOString(),
      });
    } else {
      // General credit payment
      addPayment({
        id: generateId(), customerId: customer.id, customerName: customer.name,
        amount: a, method, invoiceId: null, createdAt: new Date(paymentDate).toISOString(),
      });
    }

    updateCustomer({
      ...customer,
      totalCredit: Math.max(0, customer.totalCredit - a),
      totalPaid: customer.totalPaid + a,
    });

    toast.success(`₹${a.toLocaleString('en-IN')} recorded for ${customer.name}`);
    setAmount(''); setSelectedInvId(null);
    onPaymentDone();
  };

  return (
    <div className="space-y-4">
      {/* Unpaid invoices */}
      <div className="card-surface rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="heading text-sm">Unpaid Bills</h2>
        </div>
        {unpaidInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No pending bills 🎉</div>
        ) : (
          <div className="divide-y divide-border">
            {unpaidInvoices.map(inv => {
              const due = inv.totalAmount - inv.paidAmount;
              return (
                <button key={inv.id} onClick={() => { setSelectedInvId(inv.id); setAmount(String(due)); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/30 transition-colors ${selectedInvId === inv.id ? 'bg-accent/10 ring-1 ring-accent' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="mono-num text-xs text-muted-foreground">{inv.invoiceNo}</span>
                      <span className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</span>
                      {inv.buyingForClient && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">For: {inv.buyingForClient}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${inv.status === 'Partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                        {inv.status}
                      </span>
                      <span className="mono-num font-semibold text-danger">₹{due.toLocaleString('en-IN')} due</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total: ₹{inv.totalAmount.toLocaleString('en-IN')} | Paid: ₹{inv.paidAmount.toLocaleString('en-IN')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment form */}
      <div className="card-surface rounded-xl p-4 space-y-3">
        <h2 className="heading text-sm">
          {selectedInv ? `Pay for ${selectedInv.invoiceNo}` : 'General Credit Payment'}
        </h2>
        {selectedInv && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Remaining for this bill</span>
            <span className="mono-num text-warning font-semibold">₹{remaining.toLocaleString('en-IN')}</span>
          </div>
        )}
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ₹"
          className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Payment Date</label>
          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="flex gap-1.5">
          {(['Cash', 'UPI', 'Mixed'] as const).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${method === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {selectedInvId && (
            <button onClick={() => { setSelectedInvId(null); setAmount(''); }} className="px-4 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground flex-1">
              General Payment
            </button>
          )}
          <button onClick={handlePay} className="px-4 py-2.5 rounded-lg text-sm bg-success text-success-foreground font-medium flex-1">
            Record ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Form ───
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
