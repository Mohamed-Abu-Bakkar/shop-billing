import { useState, useEffect } from 'react';
import { Customer, Payment } from '@/types';
import { getCustomers, getPayments, addPayment, updateCustomer, generateId } from '@/lib/store';
import { toast } from 'sonner';

interface PaymentsPageProps {
  onBack: () => void;
}

export default function PaymentsPage({ onBack }: PaymentsPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const reload = () => {
    setCustomers(getCustomers());
    setPayments(getPayments());
  };
  useEffect(reload, []);

  const filtered = payments.filter(p =>
    p.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayment = (custId: string, amount: number, method: 'Cash' | 'UPI' | 'Mixed', date: string) => {
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    addPayment({
      id: generateId(),
      customerId: custId,
      customerName: cust.name,
      amount,
      method,
      invoiceId: null,
      createdAt: new Date(date).toISOString(),
    });

    updateCustomer({
      ...cust,
      totalCredit: Math.max(0, cust.totalCredit - amount),
      totalPaid: cust.totalPaid + amount,
    });

    toast.success(`₹${amount.toLocaleString('en-IN')} received from ${cust.name}`);
    reload();
    setShowForm(false);
  };

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          <h1 className="heading text-base">Payments</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
          + Record Payment
        </button>
      </div>

      <div className="px-4 py-2 border-b border-border">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payments..."
          className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.map(p => (
          <div key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{p.customerName}</span>
              <span className="text-xs text-muted-foreground ml-2">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-2">{p.method}</span>
            </div>
            <span className="mono-num font-semibold text-success">+₹{p.amount.toLocaleString('en-IN')}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No payments recorded</div>}
      </div>

      {showForm && <PaymentForm customers={customers} onSave={handlePayment} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function PaymentForm({ customers, onSave, onClose }: {
  customers: Customer[];
  onSave: (custId: string, amount: number, method: 'Cash' | 'UPI' | 'Mixed') => void;
  onClose: () => void;
}) {
  const [custId, setCustId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Mixed'>('Cash');
  const [custSearch, setCustSearch] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const withCredit = customers.filter(c => c.totalCredit > 0);
  const filtered = withCredit.filter(c =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch)
  );
  const selected = customers.find(c => c.id === custId);

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-elevated rounded-xl w-full max-w-md p-5 space-y-4 bg-card" onClick={e => e.stopPropagation()}>
        <h2 className="heading text-base">Record Payment</h2>

        {!selected ? (
          <div>
            <input value={custSearch} onChange={e => setCustSearch(e.target.value)} placeholder="Search customer..."
              className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
            <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-border card-surface rounded-lg">
              {filtered.map(c => (
                <button key={c.id} onClick={() => setCustId(c.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between">
                  <span>{c.name}</span>
                  <span className="mono-num text-warning">₹{c.totalCredit.toLocaleString('en-IN')}</span>
                </button>
              ))}
              {filtered.length === 0 && <div className="p-3 text-center text-muted-foreground text-xs">No customers with credit</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">{selected.name}</span>
              <span className="mono-num text-sm text-warning">Pending: ₹{selected.totalCredit.toLocaleString('en-IN')}</span>
            </div>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ₹"
              className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
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
            <div className="flex justify-end gap-2">
              <button onClick={() => setCustId('')} className="px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground">Back</button>
              <button onClick={() => {
                const a = parseFloat(amount);
                if (!a || a <= 0) { toast.error('Enter valid amount'); return; }
                onSave(custId, a, method);
              }} className="px-4 py-2 rounded-lg text-sm bg-success text-success-foreground font-medium">
                Record ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
