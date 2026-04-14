import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Client, Customer, Invoice, InvoiceItem, Item, PaymentMethod } from '@/types';
import { generateId } from '@/lib/shop';
import { shopApi } from '@/lib/convex';
import { toast } from 'sonner';
import BillTemplate from './BillTemplate';

interface BillingScreenProps {
  onBack: () => void;
}

export default function BillingScreen({ onBack }: BillingScreenProps) {
  const [mode, setMode] = useState<'Retail' | 'Wholesale'>('Retail');
  const [templateType, setTemplateType] = useState<'bill' | 'quotation'>('bill');
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [billItems, setBillItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [buyingForClient, setBuyingForClient] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerIsElectrician, setNewCustomerIsElectrician] = useState(false);
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState('50000');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isClickingItem, setIsClickingItem] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  const items = (useQuery(shopApi.listItems, {}) ?? []) as Item[];
  const customers = (useQuery(shopApi.listCustomers, {}) ?? []) as Customer[];
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? null;
  const clients = (useQuery(
    shopApi.listClientsByCustomer,
    selectedCustomer?.isElectrician ? { customerId: selectedCustomer.id } : 'skip',
  ) ?? []) as Client[];
  const createCustomer = useMutation(shopApi.createCustomer);
  const createClient = useMutation(shopApi.createClient);
  const createInvoice = useMutation(shopApi.createInvoice);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'w') {
        event.preventDefault();
        setMode((currentMode) => currentMode === 'Retail' ? 'Wholesale' : 'Retail');
      }
      if (event.key === 'Escape') {
        onBack();
      }
      if (event.key === 'F5') {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  useEffect(() => {
    setBuyingForClient('');
    setClientSearch('');
  }, [selectedCustomerId]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.brand.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 20);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch),
  ).slice(0, 10);

  const addToBill = (item: Item) => {
    const existing = billItems.find((billItem) => billItem.itemId === item.id);
    if (existing) {
      setBillItems((currentItems) =>
        currentItems.map((billItem) =>
          billItem.itemId === item.id ? { ...billItem, qty: billItem.qty + 1 } : billItem,
        ),
      );
    } else {
      const price = mode === 'Retail' ? item.retailPrice : item.wholesalePrice;
      setBillItems((currentItems) => [
        ...currentItems,
        {
          itemId: item.id,
          name: item.name,
          qty: 1,
          price,
          discount: 0,
          warrantyExpiry: item.warrantyMonths > 0
            ? new Date(Date.now() + item.warrantyMonths * 30 * 86_400_000).toISOString()
            : null,
        },
      ]);
    }
    setSearch('');
    setIsClickingItem(false);
    setTimeout(() => {
      searchRef.current?.focus();
      setSearchFocused(true);
    }, 100);
  };

  const updateQty = (itemId: string, delta: number) => {
    setBillItems((currentItems) =>
      currentItems.map((billItem) =>
        billItem.itemId === itemId ? { ...billItem, qty: Math.max(1, billItem.qty + delta) } : billItem,
      ),
    );
  };

  const setQty = (itemId: string, qty: number) => {
    const newQty = Math.max(0, qty);
    if (newQty === 0) {
      removeFromBill(itemId);
      return;
    }
    setBillItems((currentItems) =>
      currentItems.map((billItem) => billItem.itemId === itemId ? { ...billItem, qty: newQty } : billItem),
    );
  };

  const removeFromBill = (itemId: string) => {
    setBillItems((currentItems) => currentItems.filter((billItem) => billItem.itemId !== itemId));
  };

  const updateDiscount = (itemId: string, discount: number) => {
    setBillItems((currentItems) =>
      currentItems.map((billItem) => billItem.itemId === itemId ? { ...billItem, discount } : billItem),
    );
  };

  const updatePrice = (itemId: string, price: number) => {
    setBillItems((currentItems) =>
      currentItems.map((billItem) => billItem.itemId === itemId ? { ...billItem, price } : billItem),
    );
  };

  const subtotal = billItems.reduce((sum, billItem) => sum + (billItem.price * billItem.qty), 0);
  const totalDiscount = billItems.reduce((sum, billItem) => sum + (billItem.price * billItem.qty * billItem.discount / 100), 0);
  const total = subtotal - totalDiscount;
  const paid = paidAmount ? parseFloat(paidAmount) : (paymentMethod === 'Credit' ? 0 : total);
  const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

  const handleSave = useCallback(async () => {
    if (billItems.length === 0) {
      toast.error('Add items to bill');
      return;
    }
    if (mode === 'Wholesale' && !selectedCustomer) {
      toast.error('Select a customer');
      return;
    }

    const invoicePayload = {
      id: generateId(),
      type: mode,
      customerId: selectedCustomer?.id ?? null,
      customerName: selectedCustomer?.name ?? null,
      items: billItems,
      totalAmount: total,
      paidAmount: templateType === 'quotation' ? 0 : paid,
      paymentMethod: templateType === 'quotation' ? 'Cash' : paymentMethod,
      status: templateType === 'quotation' ? 'Unpaid' : status,
      buyingForClient: selectedCustomer?.isElectrician && buyingForClient.trim() ? buyingForClient.trim() : null,
      createdAt: new Date().toISOString(),
      invoiceNo: '',
    };

    const saved = await createInvoice({
      invoice: invoicePayload,
      templateType,
    });

    setSavedInvoice(saved as Invoice);
    setBillItems([]);
    setSelectedCustomerId(null);
    setPaidAmount('');
    setBuyingForClient('');
    setSearch('');
    toast.success(`${templateType === 'quotation' ? 'Quotation' : 'Invoice'} ${saved.invoiceNo} ${templateType === 'quotation' ? 'generated' : 'saved'}!`);
  }, [billItems, buyingForClient, createInvoice, mode, paid, paymentMethod, selectedCustomer, status, templateType, total]);

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && filteredItems.length > 0) {
      addToBill(filteredItems[0]);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error('Customer name required');
      return;
    }
    if (!newCustomerPhone.trim()) {
      toast.error('Phone required');
      return;
    }

    const customer: Customer = {
      id: generateId(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      isElectrician: newCustomerIsElectrician,
      creditLimit: parseFloat(newCustomerCreditLimit) || 50000,
      totalCredit: 0,
      totalPaid: 0,
      behaviorScore: 'Good',
    };
    await createCustomer({ customer });
    setSelectedCustomerId(customer.id);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerIsElectrician(false);
    setNewCustomerCreditLimit('50000');
    setShowAddCustomer(false);
    toast.success(`Customer "${customer.name}" added`);
  };

  const handleAddClient = async () => {
    if (!selectedCustomer) {
      return;
    }
    if (!newClientName.trim()) {
      toast.error('Client name required');
      return;
    }

    const client: Client = {
      id: generateId(),
      customerId: selectedCustomer.id,
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
      address: newClientAddress.trim(),
      createdAt: new Date().toISOString(),
    };
    await createClient({ client });
    setBuyingForClient(client.name);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientAddress('');
    setShowAddClient(false);
    toast.success(`Client "${client.name}" added`);
  };

  return (
    <div className="h-screen flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          <h1 className="heading text-base">New {templateType === 'bill' ? 'Bill' : 'Quotation'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-md p-0.5">
            <button
              onClick={() => setTemplateType('bill')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${templateType === 'bill' ? 'bg-white text-gray-900 shadow-sm' : 'text-muted-foreground'}`}
            >
              Bill
            </button>
            <button
              onClick={() => setTemplateType('quotation')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${templateType === 'quotation' ? 'bg-white text-gray-900 shadow-sm' : 'text-muted-foreground'}`}
            >
              Quotation
            </button>
          </div>

          <button
            onClick={() => setMode('Retail')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'Retail' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            Retail
          </button>
          <button
            onClick={() => { setMode('Wholesale'); setTimeout(() => customerSearchRef.current?.focus(), 100); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === 'Wholesale' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            Wholesale <kbd className="hotkey ml-1">Alt+W</kbd>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-[3] flex flex-col border-r border-border">
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
                    }`}
                    >
                      {selectedCustomer.behaviorScore}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Credit: <span className="mono-num font-semibold text-warning">₹{selectedCustomer.totalCredit.toLocaleString('en-IN')}</span>
                    <button onClick={() => setSelectedCustomerId(null)} className="ml-3 text-danger hover:underline">Change</button>
                  </div>
                </div>
              ) : (
                <div>
                  {!showAddCustomer ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={customerSearchRef}
                          value={customerSearch}
                          onChange={(event) => setCustomerSearch(event.target.value)}
                          placeholder="Search customer by name or phone..."
                          className="flex-1 px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          autoFocus
                        />
                        <button onClick={() => setShowAddCustomer(true)} className="px-2 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium whitespace-nowrap">+ New</button>
                      </div>
                      {filteredCustomers.length > 0 && (
                        <div className="mt-1 card-elevated rounded-lg max-h-40 overflow-y-auto">
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => { setSelectedCustomerId(customer.id); setCustomerSearch(''); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between"
                            >
                              <span>{customer.name} <span className="text-muted-foreground">({customer.phone})</span></span>
                              <span className="mono-num text-xs text-muted-foreground">₹{customer.totalCredit.toLocaleString('en-IN')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs font-semibold text-foreground">Add New Customer</div>
                      <input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} placeholder="Customer name *" className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
                      <input value={newCustomerPhone} onChange={(event) => setNewCustomerPhone(event.target.value)} placeholder="Phone *" className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Electrician?</label>
                        <input type="checkbox" checked={newCustomerIsElectrician} onChange={(event) => setNewCustomerIsElectrician(event.target.checked)} className="rounded" />
                      </div>
                      <input value={newCustomerCreditLimit} onChange={(event) => setNewCustomerCreditLimit(event.target.value)} placeholder="Credit limit" type="number" className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setNewCustomerName(''); setNewCustomerPhone(''); setNewCustomerIsElectrician(false); setNewCustomerCreditLimit('50000'); setShowAddCustomer(false); }} className="px-3 py-1.5 rounded-md text-xs bg-muted text-muted-foreground">Cancel</button>
                        <button onClick={() => void handleAddCustomer()} className="px-3 py-1.5 rounded-md text-xs bg-accent text-accent-foreground font-medium">Add Customer</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedCustomer?.isElectrician && (
                <div className="mt-2">
                  {!showAddClient ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          value={clientSearch}
                          onChange={(event) => { setClientSearch(event.target.value); setBuyingForClient(''); }}
                          placeholder="Search or select client..."
                          className="flex-1 px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button onClick={() => setShowAddClient(true)} className="px-2 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium whitespace-nowrap">+ New</button>
                      </div>
                      {buyingForClient && (
                        <div className="mt-1 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/10 text-sm">
                          <span className="text-accent font-medium">Client:</span>
                          <span>{buyingForClient}</span>
                          <button onClick={() => setBuyingForClient('')} className="ml-auto text-danger text-xs hover:underline">×</button>
                        </div>
                      )}
                      {!buyingForClient && (
                        <div className="mt-1 card-elevated rounded-lg max-h-32 overflow-y-auto">
                          {clients.filter((client) => client.name.toLowerCase().includes(clientSearch.toLowerCase())).map((client) => (
                            <button
                              key={client.id}
                              onClick={() => { setBuyingForClient(client.name); setClientSearch(''); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex justify-between"
                            >
                              <span>{client.name}</span>
                              <span className="text-xs text-muted-foreground">{client.address}</span>
                            </button>
                          ))}
                          {clients.filter((client) => client.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                            <div className="p-2 text-center text-muted-foreground text-xs">No clients found. Click "+ New" to add.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs font-semibold text-foreground">Add New Client</div>
                      <input value={newClientName} onChange={(event) => setNewClientName(event.target.value)} placeholder="Client name *" className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" autoFocus />
                      <input value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} placeholder="Phone (optional)" className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                      <input value={newClientAddress} onChange={(event) => setNewClientAddress(event.target.value)} placeholder="Address / Project details" className="w-full px-3 py-2 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddClient(false)} className="px-3 py-1.5 rounded-md text-xs bg-muted text-muted-foreground">Cancel</button>
                        <button onClick={() => void handleAddClient()} className="px-3 py-1.5 rounded-md text-xs bg-accent text-accent-foreground font-medium">Add Client</button>
                      </div>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground mt-1 block">Select which client this electrician is buying for</span>
                </div>
              )}
            </div>
          )}

          <div className="p-3 border-b border-border">
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                if (!isClickingItem) {
                  setTimeout(() => setSearchFocused(false), 200);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search items... (Enter to add top result)"
              className="w-full px-4 py-3 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchFocused || search ? (
              (search ? filteredItems : items.slice(0, 30)).map((item) => (
                <button
                  key={item.id}
                  onMouseDown={() => setIsClickingItem(true)}
                  onMouseUp={() => setIsClickingItem(false)}
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

        <div className="flex-[2] flex flex-col bg-card">
          <div className="p-3 border-b border-border">
            <h2 className="heading text-sm">Bill Summary</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {billItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Add items to start billing</div>
            ) : (
              <div className="divide-y divide-border">
                {billItems.map((billItem) => (
                  <div key={billItem.itemId} className="px-3 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">{billItem.name}</span>
                      <button onClick={() => removeFromBill(billItem.itemId)} className="text-danger text-xs ml-2 hover:underline">×</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => updateQty(billItem.itemId, -1)} className="w-6 h-6 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-secondary">−</button>
                      <input
                        type="number"
                        value={billItem.qty}
                        onChange={(event) => setQty(billItem.itemId, parseInt(event.target.value, 10) || 0)}
                        className="mono-num text-xs w-12 px-1 py-1 text-center rounded bg-muted border border-input focus:outline-none focus:ring-1 focus:ring-accent"
                        min="0"
                      />
                      <button onClick={() => updateQty(billItem.itemId, 1)} className="w-6 h-6 rounded bg-muted text-foreground text-xs flex items-center justify-center hover:bg-secondary">+</button>
                      <span className="text-muted-foreground text-xs mx-1">×</span>
                      {mode === 'Wholesale' ? (
                        <input type="number" value={billItem.price} onChange={(event) => updatePrice(billItem.itemId, parseFloat(event.target.value) || 0)} className="mono-num w-20 px-2 py-1 text-xs rounded bg-muted border border-input" />
                      ) : (
                        <span className="mono-num text-xs">₹{billItem.price.toLocaleString('en-IN')}</span>
                      )}
                      {mode === 'Wholesale' && (
                        <>
                          <span className="text-muted-foreground text-xs">-</span>
                          <input type="number" value={billItem.discount} onChange={(event) => updateDiscount(billItem.itemId, parseFloat(event.target.value) || 0)} className="mono-num w-12 px-2 py-1 text-xs rounded bg-muted border border-input" placeholder="%" />
                          <span className="text-muted-foreground text-xs">%</span>
                        </>
                      )}
                      <span className="mono-num font-semibold text-xs ml-auto">
                        ₹{(billItem.price * billItem.qty * (1 - billItem.discount / 100)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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

            <div className="flex gap-1.5">
              {(['Cash', 'UPI', 'Mixed', ...(mode === 'Wholesale' ? ['Credit'] : [])] as PaymentMethod[]).map((methodOption) => (
                <button
                  key={methodOption}
                  onClick={() => setPaymentMethod(methodOption)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${paymentMethod === methodOption ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                >
                  {methodOption}
                </button>
              ))}
            </div>

            {(paymentMethod === 'Mixed' || paymentMethod === 'Credit') && (
              <input
                type="number"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder="Paid amount..."
                className="w-full px-3 py-2 rounded-lg border border-input text-sm mono-num focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}

            <button
              onClick={() => void handleSave()}
              className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Save & Print {templateType === 'quotation' ? 'Quotation' : 'Bill'} <kbd className="hotkey ml-2 bg-accent-foreground/20 border-accent-foreground/30 text-accent-foreground/80">F5</kbd>
            </button>
          </div>
        </div>
      </div>

      {savedInvoice && (
        <BillTemplate invoice={savedInvoice} onClose={() => setSavedInvoice(null)} type={templateType} />
      )}
    </div>
  );
}
