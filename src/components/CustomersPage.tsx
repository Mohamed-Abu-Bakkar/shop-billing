import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { BehaviorScore, Client, Customer, Invoice } from '@/types';
import { generateId } from '@/lib/id';
import { shopApi } from '@/lib/convex';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye } from 'lucide-react';

interface CustomersPageProps {
  onBack: () => void;
}

export default function CustomersPage({ onBack }: CustomersPageProps) {
  const customers = (useQuery(shopApi.listCustomers, {}) ?? []) as Customer[];
  const invoices = (useQuery(shopApi.listInvoices, {}) ?? []) as Invoice[];
  const createCustomer = useMutation(shopApi.createCustomer);
  const saveCustomer = useMutation(shopApi.updateCustomer);
  const deleteCustomer = useMutation(shopApi.deleteCustomer);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'clients' | 'payments'>('history');

  const selectedCust = customers.find((customer) => customer.id === selectedCustomerId) ?? null;
  const filtered = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) || customer.phone.includes(search),
  );
  const customerInvoices = selectedCust ? invoices.filter((invoice) => invoice.customerId === selectedCust.id) : [];
  const unpaidInvoices = customerInvoices.filter((invoice) => invoice.status !== 'Paid');

  const handleSave = async (customer: Customer) => {
    const { _creationTime, _id, ...customerData } = customer;
    if (editCust) {
      await saveCustomer({ customer: customerData });
      toast.success('Customer updated');
    } else {
      await createCustomer({ customer: customerData });
      toast.success('Customer added');
    }
    setShowForm(false);
    setEditCust(null);
    setSelectedCustomerId(customer.id);
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteCustomer({ id });
    toast.success(`Customer "${name}" deleted`);
  };

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedCust ? () => { setSelectedCustomerId(null); setActiveTab('history'); } : onBack}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back
          </button>
          <h1 className="heading text-base">{selectedCust ? selectedCust.name : 'Customers'}</h1>
        </div>
        {!selectedCust && (
          <button
            onClick={() => { setEditCust(null); setShowForm(true); }}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground"
          >
            + Add Customer
          </button>
        )}
      </div>

      {selectedCust ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              }`}
              >
                {selectedCust.behaviorScore}
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['history', ...(selectedCust.isElectrician ? ['clients'] : []), 'payments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors capitalize ${
                  activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'history' ? 'Transactions' : tab === 'clients' ? 'Clients' : 'Pay Credit'}
              </button>
            ))}
          </div>

          {activeTab === 'history' && <TransactionHistory invoices={customerInvoices} />}
          {activeTab === 'clients' && selectedCust.isElectrician && <ClientManager customerId={selectedCust.id} />}
          {activeTab === 'payments' && (
            <CreditPayment customer={selectedCust} unpaidInvoices={unpaidInvoices} />
          )}
        </div>
      ) : (
        <>
          <div className="px-4 py-2 border-b border-border">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers..."
              className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Credit</th>
                  <th className="px-4 py-2 text-center">Behavior</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-medium">{customer.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{customer.phone}</td>
                    <td className="px-4 py-2.5">
                      {customer.isElectrician && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">Electrician</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right mono-num text-warning">₹{customer.totalCredit.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        customer.behaviorScore === 'Good' ? 'bg-success/10 text-success' :
                        customer.behaviorScore === 'Late' ? 'bg-warning/10 text-warning' :
                        customer.behaviorScore === 'Risky' ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'
                      }`}>
                        {customer.behaviorScore}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditCust(customer); setShowForm(true); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-accent/10 text-accent mr-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(customer.id, customer.name); }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-danger/10 text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No customers found</div>}
          </div>
        </>
      )}

      {showForm && (
        <CustomerForm
          customer={editCust}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditCust(null); }}
        />
      )}
    </div>
  );
}

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
          {invoices.map((invoice) => (
            <div key={invoice.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="mono-num text-xs text-muted-foreground">{invoice.invoiceNo}</span>
                <span className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>
                {invoice.buyingForClient && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                    For: {invoice.buyingForClient}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  invoice.status === 'Paid' ? 'bg-success/10 text-success' :
                  invoice.status === 'Partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                }`}
                >
                  {invoice.status}
                </span>
                <span className="mono-num font-semibold">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientManager({ customerId }: { customerId: string }) {
  const clients = (useQuery(shopApi.listClientsByCustomer, { customerId }) ?? []) as Client[];
  const createClient = useMutation(shopApi.createClient);
  const updateClient = useMutation(shopApi.updateClient);
  const removeClient = useMutation(shopApi.deleteClient);
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setShowAdd(false);
    setEditClient(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Client name required');
      return;
    }
    if (editClient) {
      await updateClient({
        client: { ...editClient, name: name.trim(), phone: phone.trim(), address: address.trim() },
      });
      toast.success(`Client "${name}" updated`);
    } else {
      const client: Client = {
        id: generateId(),
        customerId,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        createdAt: new Date().toISOString(),
      };
      await createClient({ client });
      toast.success(`Client "${name}" added`);
    }
    resetForm();
  };

  const handleEdit = (client: Client) => {
    setName(client.name);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setEditClient(client);
    setShowAdd(true);
  };

  const handleDelete = async (id: string, clientName: string) => {
    await removeClient({ id });
    toast.success(`Client "${clientName}" removed`);
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
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Client name *"
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone (optional)"
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Address / Project details"
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-md text-xs bg-muted text-muted-foreground">Cancel</button>
            <button onClick={handleSave} className="px-3 py-1.5 rounded-md text-xs bg-accent text-accent-foreground font-medium">
              {editClient ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No clients added yet</div>
      ) : (
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <div key={client.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{client.name}</span>
                {client.phone && <span className="text-muted-foreground text-xs ml-2">{client.phone}</span>}
                {client.address && <span className="text-muted-foreground text-xs ml-2">· {client.address}</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(client)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-accent/10 text-accent">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(client.id, client.name)} className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-danger/10 text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreditPayment({ customer, unpaidInvoices }: { customer: Customer; unpaidInvoices: Invoice[] }) {
  const applyCustomerPayment = useMutation(shopApi.applyCustomerPayment);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Mixed'>('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedInv = unpaidInvoices.find((invoice) => invoice.id === selectedInvId);
  const remaining = selectedInv ? selectedInv.totalAmount - selectedInv.paidAmount : 0;

  const handlePay = async () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Enter valid amount');
      return;
    }
    if (!paymentDate) {
      toast.error('Select a date');
      return;
    }

    await applyCustomerPayment({
      invoiceId: selectedInv?.id ?? null,
      payment: {
        id: generateId(),
        customerId: customer.id,
        customerName: customer.name,
        amount: paymentAmount,
        method,
        invoiceId: selectedInv?.id ?? null,
        createdAt: new Date(paymentDate).toISOString(),
      },
    });

    toast.success(`₹${paymentAmount.toLocaleString('en-IN')} recorded for ${customer.name}`);
    setAmount('');
    setSelectedInvId(null);
  };

  return (
    <div className="space-y-4">
      <div className="card-surface rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="heading text-sm">Unpaid Bills</h2>
        </div>
        {unpaidInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No pending bills 🎉</div>
        ) : (
          <div className="divide-y divide-border">
            {unpaidInvoices.map((invoice) => {
              const due = invoice.totalAmount - invoice.paidAmount;
              return (
                <button
                  key={invoice.id}
                  onClick={() => { setSelectedInvId(invoice.id); setAmount(String(due)); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/30 transition-colors ${
                    selectedInvId === invoice.id ? 'bg-accent/10 ring-1 ring-accent' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="mono-num text-xs text-muted-foreground">{invoice.invoiceNo}</span>
                      <span className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>
                      {invoice.buyingForClient && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">For: {invoice.buyingForClient}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        invoice.status === 'Partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                      }`}
                      >
                        {invoice.status}
                      </span>
                      <span className="mono-num font-semibold text-danger">₹{due.toLocaleString('en-IN')} due</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total: ₹{invoice.totalAmount.toLocaleString('en-IN')} | Paid: ₹{invoice.paidAmount.toLocaleString('en-IN')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-surface rounded-xl p-4 space-y-3">
        <h2 className="heading text-sm">{selectedInv ? `Pay for ${selectedInv.invoiceNo}` : 'General Credit Payment'}</h2>
        {selectedInv && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Remaining for this bill</span>
            <span className="mono-num text-warning font-semibold">₹{remaining.toLocaleString('en-IN')}</span>
          </div>
        )}
        <input
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount ₹"
          className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-1.5">
          {(['Cash', 'UPI', 'Mixed'] as const).map((paymentMethod) => (
            <button
              key={paymentMethod}
              onClick={() => setMethod(paymentMethod)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                method === paymentMethod ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {paymentMethod}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {selectedInvId && (
            <button onClick={() => { setSelectedInvId(null); setAmount(''); }} className="px-4 py-2.5 rounded-lg text-sm bg-muted text-muted-foreground flex-1">
              General Payment
            </button>
          )}
          <button onClick={() => void handlePay()} className="px-4 py-2.5 rounded-lg text-sm bg-success text-success-foreground font-medium flex-1">
            Record ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerForm({ customer, onSave, onClose }: { customer: Customer | null; onSave: (customer: Customer) => void | Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Customer>(customer || {
    id: generateId(),
    name: '',
    phone: '',
    isElectrician: false,
    creditLimit: 50000,
    totalCredit: 0,
    totalPaid: 0,
    behaviorScore: 'Good',
  });

  const setField = <K extends keyof Customer>(key: K, value: Customer[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-elevated rounded-xl w-full max-w-md p-5 space-y-4 bg-card" onClick={(event) => event.stopPropagation()}>
        <h2 className="heading text-base">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
        <div className="space-y-3">
          <input placeholder="Customer name *" value={form.name} onChange={(event) => setField('name', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <input placeholder="Phone number" value={form.phone} onChange={(event) => setField('phone', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isElectrician} onChange={(event) => setField('isElectrician', event.target.checked)} id="isElec" />
            <label htmlFor="isElec" className="text-sm">Electrician</label>
          </div>
          <input type="number" placeholder="Credit limit ₹" value={form.creditLimit || ''} onChange={(event) => setField('creditLimit', Number(event.target.value))} className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent" />
          <select value={form.behaviorScore} onChange={(event) => setField('behaviorScore', event.target.value as BehaviorScore)} className="w-full px-3 py-2 rounded-lg border border-input text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent">
            {(['Good', 'Regular', 'Late', 'Risky'] as BehaviorScore[]).map((behavior) => <option key={behavior} value={behavior}>{behavior}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-muted text-muted-foreground">Cancel</button>
          <button
            onClick={() => {
              if (!form.name) {
                toast.error('Name required');
                return;
              }
              void onSave(form);
            }}
            className="px-4 py-2 rounded-lg text-sm bg-accent text-accent-foreground font-medium"
          >
            {customer ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
