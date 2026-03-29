import { useState, useEffect, useRef, useCallback } from 'react';
import { Item, Customer, InvoiceItem, PaymentMethod, Invoice } from '@/types';
import { getItems, getCustomers, updateItem, addInvoice, updateCustomer, generateId, generateInvoiceNo } from '@/lib/store';
import { toast } from 'sonner';

interface BillingScreenProps {
  onBack: () => void;
}

export default function BillingScreen({ onBack }: BillingScreenProps) {
  const [mode, setMode] = useState<'Retail' | 'Wholesale'>('Retail');
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [billItems, setBillItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [buyingForClient, setBuyingForClient] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(getItems());
    setCustomers(getCustomers());
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'w') { e.preventDefault(); setMode(m => m === 'Retail' ? 'Wholesale' : 'Retail'); }
      if (e.key === 'Escape') onBack();
      if (e.key === 'F5') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [billItems, selectedCustomer, paymentMethod, paidAmount]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.brand.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  ).slice(0, 10);

  const addToBill = (item: Item) => {
    const existing = billItems.find(b => b.itemId === item.id);
    if (existing) {
      setBillItems(billItems.map(b => b.itemId === item.id ? { ...b, qty: b.qty + 1 } : b));
    } else {
      const price = mode === 'Retail' ? item.retailPrice : item.wholesalePrice;
      setBillItems([...billItems, {
        itemId: item.id,
        name: item.name,
        qty: 1,
        price,
        discount: 0,
        warrantyExpiry: item.warrantyMonths > 0 ? new Date(Date.now() + item.warrantyMonths * 30 * 86400000).toISOString() : null,
      }]);
    }
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (itemId: string, delta: number) => {
    setBillItems(prev => prev.map(b => b.itemId === itemId ? { ...b, qty: Math.max(1, b.qty + delta) } : b));
  };

  const removeFromBill = (itemId: string) => {
    setBillItems(prev => prev.filter(b => b.itemId !== itemId));
  };

  const updateDiscount = (itemId: string, disc: number) => {
    setBillItems(prev => prev.map(b => b.itemId === itemId ? { ...b, discount: disc } : b));
  };

  const updatePrice = (itemId: string, price: number) => {
    setBillItems(prev => prev.map(b => b.itemId === itemId ? { ...b, price } : b));
  };

  const subtotal = billItems.reduce((s, b) => s + (b.price * b.qty), 0);
  const totalDiscount = billItems.reduce((s, b) => s + (b.price * b.qty * b.discount / 100), 0);
  const total = subtotal - totalDiscount;
  const paid = paidAmount ? parseFloat(paidAmount) : (paymentMethod === 'Credit' ? 0 : total);
  const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

  const handleSave = useCallback(() => {
    if (billItems.length === 0) { toast.error('Add items to bill'); return; }
    if (mode === 'Wholesale' && !selectedCustomer) { toast.error('Select a customer'); return; }

    const inv: Invoice = {
      id: generateId(),
      invoiceNo: generateInvoiceNo(),
      type: mode,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || null,
      items: billItems,
      totalAmount: total,
      paidAmount: paid,
      paymentMethod,
      status: status as Invoice['status'],
      buyingForClient: selectedCustomer?.isElectrician && buyingForClient.trim() ? buyingForClient.trim() : null,
      createdAt: new Date().toISOString(),
    };

    // Update stock
    billItems.forEach(bi => {
      const item = items.find(i => i.id === bi.itemId);
      if (item) {
        updateItem({ ...item, stock: item.stock - bi.qty, lastSoldAt: new Date().toISOString() });
      }
    });

    // Update customer credit
    if (selectedCustomer && status !== 'Paid') {
      const unpaid = total - paid;
      updateCustomer({ ...selectedCustomer, totalCredit: selectedCustomer.totalCredit + unpaid });
    }

    addInvoice(inv);
    toast.success(`Invoice ${inv.invoiceNo} saved!`);
    setBillItems([]);
    setSelectedCustomer(null);
    setPaidAmount('');
    setBuyingForClient('');
    setSearch('');
    setItems(getItems());
  }, [billItems, selectedCustomer, mode, total, paid, paymentMethod, status, items]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      addToBill(filtered[0]);
    }
  };

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          <h1 className="heading text-base">New Bill</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('Retail')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'Retail' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >Retail</button>
          <button
            onClick={() => { setMode('Wholesale'); setTimeout(() => customerSearchRef.current?.focus(), 100); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'Wholesale' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
          >Wholesale <kbd className="hotkey ml-1">Alt+W</kbd></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Item Search */}
        <div className="flex-[3] flex flex-col border-r border-border">
          {/* Wholesale: Customer selector */}
          {mode === 'Wholesale' && (
            <div className="p-3 border-b border-border bg-muted/30">
              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">{selectedCustomer.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded font-medium ${
                      selectedCustomer.behaviorScore === 'Good' ? 'bg-success/10 text-success' :
                      selectedCustomer.behaviorScore === 'Late' ? 'bg-warning/10 text-warning' :
                      selectedCustomer.behaviorScore === 'Risky' ? 'bg-danger/10 text-danger' :
                      'bg-muted text-muted-foreground'
                    }`}>{selectedCustomer.behaviorScore}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Credit: <span className="mono-num font-semibold text-warning">₹{selectedCustomer.totalCredit.toLocaleString('en-IN')}</span>
                    <button onClick={() => setSelectedCustomer(null)} className="ml-3 text-danger hover:underline">Change</button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search customer by name or phone..."
                    className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {customerSearch && (
                    <div className="mt-1 card-elevated rounded-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between">
                          <span>{c.name} <span className="text-muted-foreground">({c.phone})</span></span>
                          <span className="mono-num text-xs text-muted-foreground">₹{c.totalCredit.toLocaleString('en-IN')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selectedCustomer?.isElectrician && (
                <div className="mt-2">
                  <input
                    value={buyingForClient}
                    onChange={e => setBuyingForClient(e.target.value)}
                    placeholder="Buying for client name (e.g. Ramesh - House wiring)"
                    className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">Track which client this electrician is buying for</span>
                </div>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="p-3 border-b border-border">
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search items... (Enter to add top result)"
              className="w-full px-4 py-3 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto">
            {searchFocused || search ? (
              (search ? filtered : items.slice(0, 30)).map(item => (
                <button
                  key={item.id}
                  onClick={() => addToBill(item)}
                  className="w-full text-left px-4 py-2.5 border-b border-border hover:bg-muted/50 transition-colors flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{item.brand}</span>
                    {item.stock <= item.minStock && (
                      <span className="ml-2 text-xs text-warning font-medium">Low: {item.stock} left</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{item.stock} {item.unit}</span>
                    <span className="mono-num font-semibold">₹{(mode === 'Retail' ? item.retailPrice : item.wholesalePrice).toLocaleString('en-IN')}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">Click search or start typing to see items</div>
            )}
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="flex-[2] flex flex-col bg-card">
          <div className="p-3 border-b border-border">
            <h2 className="heading text-sm">Bill Summary</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {billItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Add items to start billing</div>
            ) : (
              <div className="divide-y divide-border">
                {billItems.map(bi => (
                  <div key={bi.itemId} className="px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">{bi.name}</span>
                      <button onClick={() => removeFromBill(bi.itemId)} className="text-danger text-xs ml-2 hover:underline">×</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => updateQty(bi.itemId, -1)} className="w-6 h-6 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-secondary">−</button>
                      <span className="mono-num text-xs w-8 text-center">{bi.qty}</span>
                      <button onClick={() => updateQty(bi.itemId, 1)} className="w-6 h-6 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-secondary">+</button>
                      <span className="text-muted-foreground text-xs mx-1">×</span>
                      {mode === 'Wholesale' ? (
                        <input
                          type="number"
                          value={bi.price}
                          onChange={e => updatePrice(bi.itemId, parseFloat(e.target.value) || 0)}
                          className="mono-num w-20 px-2 py-1 text-xs rounded bg-muted border border-input"
                        />
                      ) : (
                        <span className="mono-num text-xs">₹{bi.price.toLocaleString('en-IN')}</span>
                      )}
                      {mode === 'Wholesale' && (
                        <>
                          <span className="text-muted-foreground text-xs">-</span>
                          <input
                            type="number"
                            value={bi.discount}
                            onChange={e => updateDiscount(bi.itemId, parseFloat(e.target.value) || 0)}
                            className="mono-num w-12 px-2 py-1 text-xs rounded bg-muted border border-input"
                            placeholder="%"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                        </>
                      )}
                      <span className="mono-num font-semibold text-xs ml-auto">
                        ₹{(bi.price * bi.qty * (1 - bi.discount / 100)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Payment */}
          <div className="border-t border-border p-3 space-y-3">
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span className="mono-num">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Discount</span>
                <span className="mono-num">-₹{totalDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="mono-num">₹{total.toLocaleString('en-IN')}</span>
            </div>

            {/* Payment method */}
            <div className="flex gap-1.5">
              {(['Cash', 'UPI', 'Mixed', ...(mode === 'Wholesale' ? ['Credit'] : [])] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${paymentMethod === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                >{m}</button>
              ))}
            </div>

            {(paymentMethod === 'Mixed' || paymentMethod === 'Credit') && (
              <input
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                placeholder="Paid amount..."
                className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}

            <button
              onClick={handleSave}
              className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Save & Print <kbd className="hotkey ml-2 bg-accent-foreground/20 border-accent-foreground/30 text-accent-foreground/80">F5</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
