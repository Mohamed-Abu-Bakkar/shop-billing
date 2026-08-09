import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Customer, Invoice, InvoiceItem, Item } from '@/types';
import { api } from '@convex/_generated/api';
import { toast } from 'sonner';
import { LoadingButton } from './ui/loading-button';
import { generateId } from '@/lib/id';

interface InvoiceEditModalProps {
  invoice: Invoice;
  onClose: () => void;
  onDelete: () => void;
}

export default function InvoiceEditModal({ invoice, onClose, onDelete }: InvoiceEditModalProps) {
  const [customerName, setCustomerName] = useState(invoice.customerName ?? '');
  const [customerId, setCustomerId] = useState<string | null>(invoice.customerId);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paidAmount, setPaidAmount] = useState(String(invoice.paidAmount));
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod);
  const [createdAt, setCreatedAt] = useState(invoice.createdAt.slice(0, 16));
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items.map(i => ({ ...i })));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [search, setSearch] = useState('');
  const [isClickingItem, setIsClickingItem] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const allItems = (useQuery(api.shop.listItems, {}) ?? []) as Item[];
  const customers = (useQuery(api.shop.listCustomers, {}) ?? []) as Customer[];
  const updateInvoice = useMutation(api.shop.updateInvoice);
  const createInvoice = useMutation(api.shop.createInvoice);

  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.brand.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const selectedCustomer = customers.find(c => c.id === customerId) ?? null;
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  ).slice(0, 10);

  const pickCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerSearch('');
  };

  const clearCustomer = () => {
    setCustomerId(null);
    setCustomerName('');
    setCustomerSearch('');
  };

  const totalAmount = items.reduce((s, i) => s + i.price * i.qty * (1 - i.discount / 100), 0);
  const paid = parseFloat(paidAmount) || 0;

  const addItemFromInventory = (item: Item) => {
    const existing = items.find(i => i.itemId === item.id);
    if (existing) {
      setItems(prev => prev.map(i =>
        i.itemId === item.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setItems(prev => [...prev, {
        itemId: item.id,
        name: item.name,
        qty: 1,
        price: item.retailPrice,
        discount: 0,
        warrantyExpiry: item.warrantyMonths > 0
          ? new Date(Date.now() + item.warrantyMonths * 30 * 86_400_000).toISOString()
          : null,
      }]);
    }
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredItems.length > 0) {
      addItemFromInventory(filteredItems[0]);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const buildInvoice = () => {
    const { _creationTime, _id, ...rest } = invoice as any;
    return {
      ...rest,
      customerId,
      customerName: customerName.trim() || null,
      items,
      totalAmount,
      paidAmount: Math.min(paid, totalAmount),
      status: paid >= totalAmount ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid',
      paymentMethod: paymentMethod as Invoice['paymentMethod'],
      createdAt: new Date(createdAt).toISOString(),
    };
  };

  const handleResave = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    try {
      await updateInvoice({ invoice: buildInvoice() });
      toast.success('Invoice updated');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleSaveNew = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    try {
      const data = buildInvoice();
      const created = await createInvoice({
        invoice: { ...data, id: generateId() },
        templateType: 'bill',
      });
      toast.success(`New invoice ${created.invoiceNo} created`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleDelete = async () => {
    try {
      onDelete();
      onClose();
    } catch {
      // handled by parent
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="heading text-base">Edit Invoice {invoice.invoiceNo}</h2>
          <LoadingButton onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</LoadingButton>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</label>
              {selectedCustomer ? (
                <div className="mt-1 px-3 py-2 text-sm rounded-md bg-muted border border-border flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-medium">{selectedCustomer.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{selectedCustomer.phone}</span>
                  </div>
                  <button type="button" onClick={clearCustomer}
                    className="text-sm text-muted-foreground hover:text-danger shrink-0 ml-2" title="Remove customer">
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Walk-in / custom name"
                  />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Search & link customer..."
                  />
                  {customerSearch && (
                    <div className="mt-1 max-h-40 overflow-y-auto divide-y divide-border border border-border rounded-md bg-card">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">No matching customer</div>
                      ) : (
                        filteredCustomers.map(c => (
                          <button key={c.id} type="button" onClick={() => pickCustomer(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between items-center gap-2">
                            <span className="font-medium truncate">{c.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{c.phone}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</label>
              <input
                type="datetime-local"
                value={createdAt}
                onChange={e => setCreatedAt(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid Amount</label>
              <input
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                min={0}
                className="w-full mt-1 px-3 py-2 text-sm rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary mono-num"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-md bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Mixed">Mixed</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</label>
              <div className="mt-1 px-3 py-2 text-sm rounded-md bg-muted/50 border border-border mono-num font-semibold">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Items ({items.length})</label>

            <div className="p-3 border border-border rounded-md mb-2 bg-muted/20">
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => {}}
                onBlur={() => {
                  if (!isClickingItem) {
                    setTimeout(() => setSearch(''), 200);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search items... (Enter to add top result)"
                className="w-full px-4 py-3 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              {search && (
                <div className="mt-2 divide-y divide-border border border-border rounded-md bg-card max-h-40 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No items found</div>
                  ) : (
                    filteredItems.map(item => (
                      <button
                        key={item.id}
                        onMouseDown={() => { setIsClickingItem(true); addItemFromInventory(item); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="mono-num text-xs text-muted-foreground">₹{item.retailPrice.toLocaleString('en-IN')}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="divide-y divide-border border border-border rounded-md text-sm">
                {items.map((item, i) => (
                  <div key={i} className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-medium text-sm truncate">{item.name}</span>
                      <LoadingButton onClick={() => removeItem(i)}
                        className="p-1.5 text-muted-foreground hover:text-danger shrink-0">✕</LoadingButton>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Qty</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => updateItem(i, 'qty', Math.max(0, parseInt(e.target.value) || 0))}
                          min={0}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary mono-num"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Price</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={e => updateItem(i, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                          min={0}
                          step={0.01}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary mono-num"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Discount %</label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={e => updateItem(i, 'discount', Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                          min={0}
                          max={100}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary mono-num"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Line Total</label>
                        <div className="w-full px-2 py-1 text-xs mono-num font-semibold mt-1">
                          ₹{(item.price * item.qty * (1 - item.discount / 100)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-danger">Delete this invoice?</span>
              <LoadingButton onClick={handleDelete} className="px-3 py-1.5 text-xs rounded-md bg-danger text-danger-foreground hover:opacity-90">Confirm</LoadingButton>
              <LoadingButton onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs rounded-md bg-muted text-muted-foreground">Cancel</LoadingButton>
            </div>
          ) : (
            <LoadingButton onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 text-xs rounded-md bg-danger/10 text-danger hover:bg-danger/20">Delete</LoadingButton>
          )}
          <div className="flex items-center gap-2">
            <LoadingButton onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80">Cancel</LoadingButton>
            {confirmSave ? (
              <div className="flex items-center gap-1">
                <LoadingButton onClick={() => { setConfirmSave(false); handleResave(); }}
                  className="px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground">Update Existing</LoadingButton>
                <LoadingButton onClick={() => { setConfirmSave(false); handleSaveNew(); }}
                  className="px-3 py-2 text-xs rounded-md bg-accent text-accent-foreground">Save as New</LoadingButton>
                <LoadingButton onClick={() => setConfirmSave(false)}
                  className="px-3 py-2 text-xs rounded-md bg-muted text-muted-foreground">Cancel</LoadingButton>
              </div>
            ) : (
              <LoadingButton onClick={() => setConfirmSave(true)}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90">Save</LoadingButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
