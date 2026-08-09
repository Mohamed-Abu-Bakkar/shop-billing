import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Customer, Invoice, Payment } from '@/types';
import { generateId } from '@/lib/id';
import { shopApi } from '@/lib/convex';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { LoadingButton } from './ui/loading-button';

interface PaymentsPageProps {
  onBack: () => void;
}

export default function PaymentsPage({ onBack }: PaymentsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const customers = (useQuery(shopApi.listCustomers, {}) ?? []) as Customer[];
  const payments = (useQuery(shopApi.listPayments, {}) ?? []) as Payment[];
  const invoices = (useQuery(shopApi.listInvoices, {}) ?? []) as Invoice[];
  const applyCustomerPayment = useMutation(shopApi.applyCustomerPayment);

  const filtered = payments.filter((p) =>
    p.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv.invoiceNo]));

  const handlePayment = async (custId: string, amount: number, method: 'Cash' | 'UPI' | 'Mixed', date: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;
    const result = await applyCustomerPayment({
      invoiceId: null,
      payment: {
        id: generateId(),
        customerId: custId,
        customerName: cust.name,
        amount,
        method,
        invoiceId: null,
        createdAt: new Date(date).toISOString(),
      },
    });
    if (result.success) {
      toast.success(`₹${amount.toLocaleString('en-IN')} received from ${cust.name}`);
      setShowForm(false);
    }
  };

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <LoadingButton onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</LoadingButton>
          <h1 className="heading text-base">Payments</h1>
        </div>
        <LoadingButton onClick={() => setShowForm(true)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
          + Record Payment
        </LoadingButton>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="card-surface rounded-xl p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Received</div>
          <div className="mono-num text-lg font-semibold text-success mt-1">₹{totalReceived.toLocaleString('en-IN')}</div>
        </div>
        <div className="card-surface rounded-xl p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Payments</div>
          <div className="text-lg font-semibold mt-1">{payments.length}</div>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments by customer..."
          className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.map((p) => (
          <div key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{p.customerName}</span>
              <span className="text-xs text-muted-foreground ml-2">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-2">{p.method}</span>
              {p.invoiceId && invoiceMap.get(p.invoiceId) && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent ml-2">{invoiceMap.get(p.invoiceId)}</span>
              )}
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
  onSave: (custId: string, amount: number, method: 'Cash' | 'UPI' | 'Mixed', date: string) => Promise<void>;
  onClose: () => void;
}) {
  const [custId, setCustId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Mixed'>('Cash');
  const [custSearch, setCustSearch] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const withCredit = customers.filter((c) => c.totalCredit > 0);
  const filtered = withCredit.filter((c) =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch),
  );
  const selected = customers.find((c) => c.id === custId);

  const selectCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustId(id);
    setAmount(cust && cust.totalCredit > 0 ? String(cust.totalCredit) : '');
  };

  const reset = () => {
    setCustId('');
    setAmount('');
    setMethod('Cash');
    setCustSearch('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const record = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) {
      toast.error('Enter valid amount');
      return Promise.resolve();
    }
    if (!paymentDate) {
      toast.error('Select a date');
      return Promise.resolve();
    }
    reset();
    return onSave(custId, a, method, paymentDate);
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-elevated rounded-xl w-full max-w-md p-5 space-y-4 bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="heading text-base">Record Payment</h2>
          <LoadingButton onClick={onClose} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </LoadingButton>
        </div>

        {!selected ? (
          <div>
            <input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="Search customer..."
              className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
            <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-border card-surface rounded-lg">
              {filtered.map((c) => (
                <LoadingButton key={c.id} onClick={() => { selectCustomer(c.id); return Promise.resolve(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between">
                  <span>{c.name} <span className="text-muted-foreground text-xs">({c.phone})</span></span>
                  <span className="mono-num text-warning">₹{c.totalCredit.toLocaleString('en-IN')}</span>
                </LoadingButton>
              ))}
              {filtered.length === 0 && <div className="p-3 text-center text-muted-foreground text-xs">No customers with pending credit</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">{selected.name}</span>
              <span className="mono-num text-sm text-warning">Outstanding: ₹{selected.totalCredit.toLocaleString('en-IN')}</span>
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹"
              className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Payment Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div className="flex gap-1.5">
              {(['Cash', 'UPI', 'Mixed'] as const).map((m) => (
                <LoadingButton key={m} onClick={() => { setMethod(m); return Promise.resolve(); }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${method === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {m}
                </LoadingButton>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <LoadingButton onClick={() => { reset(); return Promise.resolve(); }} className="px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground">Back</LoadingButton>
              <LoadingButton onClick={record} className="px-4 py-2 rounded-lg text-sm bg-success text-success-foreground font-medium">
                Record ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </LoadingButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}