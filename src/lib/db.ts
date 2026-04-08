import { Item, Customer, Invoice, Payment, Client } from '@/types';

const ITEMS_KEY = 'vl_items';
const CUSTOMERS_KEY = 'vl_customers';
const INVOICES_KEY = 'vl_invoices';
const PAYMENTS_KEY = 'vl_payments';

const SEED_ITEMS: Item[] = [
  { id: "i1", name: "LED Bulb 9W", brand: "Philips", category: "Bulb", unit: "pc", purchasePrice: 45, retailPrice: 75, wholesalePrice: 60, stock: 500, minStock: 50, warrantyMonths: 12, lastSoldAt: null, alternates: [] },
  { id: "i2", name: "LED Tube 20W", brand: "Syska", category: "Bulb", unit: "pc", purchasePrice: 120, retailPrice: 180, wholesalePrice: 150, stock: 200, minStock: 30, warrantyMonths: 24, lastSoldAt: null, alternates: [] },
  { id: "i3", name: "Ceiling Fan 1200mm", brand: "Havells", category: "Fan", unit: "pc", purchasePrice: 1400, retailPrice: 2200, wholesalePrice: 1800, stock: 25, minStock: 5, warrantyMonths: 24, lastSoldAt: null, alternates: [] },
  { id: "i4", name: "Exhaust Fan 300mm", brand: "Crompton", category: "Fan", unit: "pc", purchasePrice: 800, retailPrice: 1200, wholesalePrice: 950, stock: 40, minStock: 10, warrantyMonths: 12, lastSoldAt: null, alternates: [] },
  { id: "i5", name: "Copper Wire 1.5sqmm", brand: "Finolex", category: "Wire", unit: "mtr", purchasePrice: 18, retailPrice: 28, wholesalePrice: 22, stock: 5000, minStock: 500, warrantyMonths: 0, lastSoldAt: null, alternates: [] },
  { id: "i6", name: "Copper Wire 2.5sqmm", brand: "Finolex", category: "Wire", unit: "mtr", purchasePrice: 28, retailPrice: 42, wholesalePrice: 35, stock: 3000, minStock: 300, warrantyMonths: 0, lastSoldAt: null, alternates: [] },
  { id: "i7", name: "Copper Wire 4sqmm", brand: "Finolex", category: "Wire", unit: "mtr", purchasePrice: 45, retailPrice: 65, wholesalePrice: 55, stock: 2000, minStock: 200, warrantyMonths: 0, lastSoldAt: null, alternates: [] },
  { id: "i8", name: "MCB 16A Single", brand: "Schneider", category: "MCB", unit: "pc", purchasePrice: 120, retailPrice: 180, wholesalePrice: 150, stock: 100, minStock: 20, warrantyMonths: 36, lastSoldAt: null, alternates: [] },
  { id: "i9", name: "MCB 32A Double", brand: "Schneider", category: "MCB", unit: "pc", purchasePrice: 180, retailPrice: 260, wholesalePrice: 220, stock: 80, minStock: 15, warrantyMonths: 36, lastSoldAt: null, alternates: [] },
  { id: "i10", name: "Switch Socket 6A", brand: "Anchor", category: "Switch", unit: "pc", purchasePrice: 35, retailPrice: 55, wholesalePrice: 45, stock: 300, minStock: 50, warrantyMonths: 12, lastSoldAt: null, alternates: [] },
  { id: "i11", name: "Motor Pump 1HP", brand: "Kirloskar", category: "Motor", unit: "pc", purchasePrice: 4500, retailPrice: 6500, wholesalePrice: 5500, stock: 8, minStock: 2, warrantyMonths: 24, lastSoldAt: null, alternates: [] },
  { id: "i12", name: "PVC Conduit 25mm", brand: "Supreme", category: "PVC", unit: "mtr", purchasePrice: 25, retailPrice: 38, wholesalePrice: 30, stock: 1000, minStock: 100, warrantyMonths: 0, lastSoldAt: null, alternates: [] },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Ramesh Kumar", phone: "9876543210", isElectrician: true, creditLimit: 50000, totalCredit: 15000, totalPaid: 35000, behaviorScore: "Good" },
  { id: "c2", name: "Suresh Patel", phone: "9876543211", isElectrician: true, creditLimit: 75000, totalCredit: 25000, totalPaid: 50000, behaviorScore: "Good" },
  { id: "c3", name: "Gopal Electricals", phone: "9876543212", isElectrician: false, creditLimit: 100000, totalCredit: 0, totalPaid: 120000, behaviorScore: "Good" },
  { id: "c4", name: "Mohan Singh", phone: "9876543213", isElectrician: false, creditLimit: 30000, totalCredit: 12000, totalPaid: 18000, behaviorScore: "Late" },
  { id: "c5", name: "Ajay Kumar", phone: "9876543214", isElectrician: true, creditLimit: 40000, totalCredit: 8000, totalPaid: 22000, behaviorScore: "Good" },
];

function loadData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function initStore(): void {
  if (!localStorage.getItem(ITEMS_KEY)) {
    saveData(ITEMS_KEY, SEED_ITEMS);
  }
  if (!localStorage.getItem(CUSTOMERS_KEY)) {
    saveData(CUSTOMERS_KEY, SEED_CUSTOMERS);
  }
  if (!localStorage.getItem(INVOICES_KEY)) {
    saveData(INVOICES_KEY, []);
  }
  if (!localStorage.getItem(PAYMENTS_KEY)) {
    saveData(PAYMENTS_KEY, []);
  }
}

export async function initDb(): Promise<void> {
  initStore();
}

export const getItems = (): Item[] => loadData<Item>(ITEMS_KEY).sort((a, b) => a.name.localeCompare(b.name));

export const addItem = (item: Item): void => {
  const items = loadData<Item>(ITEMS_KEY);
  items.push(item);
  saveData(ITEMS_KEY, items);
};

export const updateItem = (item: Item): void => {
  const items = loadData<Item>(ITEMS_KEY);
  const idx = items.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
    saveData(ITEMS_KEY, items);
  }
};

export const deleteItem = (id: string): void => {
  const items = loadData<Item>(ITEMS_KEY).filter(i => i.id !== id);
  saveData(ITEMS_KEY, items);
};

export const getCustomers = (): Customer[] => loadData<Customer>(CUSTOMERS_KEY).sort((a, b) => a.name.localeCompare(b.name));

export const addCustomer = (customer: Customer): void => {
  const customers = loadData<Customer>(CUSTOMERS_KEY);
  customers.push(customer);
  saveData(CUSTOMERS_KEY, customers);
};

export const updateCustomer = (customer: Customer): void => {
  const customers = loadData<Customer>(CUSTOMERS_KEY);
  const idx = customers.findIndex(c => c.id === customer.id);
  if (idx >= 0) {
    customers[idx] = customer;
    saveData(CUSTOMERS_KEY, customers);
  }
};

export const getInvoices = (): Invoice[] => loadData<Invoice>(INVOICES_KEY)
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const addInvoice = (invoice: Invoice): void => {
  const invoices = loadData<Invoice>(INVOICES_KEY);
  invoices.push(invoice);
  saveData(INVOICES_KEY, invoices);
};

export const getPayments = (): Payment[] => loadData<Payment>(PAYMENTS_KEY)
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const addPayment = (payment: Payment): void => {
  const payments = loadData<Payment>(PAYMENTS_KEY);
  payments.push(payment);
  saveData(PAYMENTS_KEY, payments);
};

export const getCustomerPayments = (customerId: string): Payment[] => 
  loadData<Payment>(PAYMENTS_KEY)
    .filter(p => p.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// Re-export helpers
export const load = loadData;
export const save = saveData;

// Clients
const CLIENTS_KEY = 'vl_clients';

export const getClients = (): Client[] => loadData<Client>(CLIENTS_KEY);
export const addClient = (client: Client): void => {
  const clients = loadData<Client>(CLIENTS_KEY);
  clients.push(client);
  saveData(CLIENTS_KEY, clients);
};
export const getClientsByCustomer = (customerId: string): Client[] => 
  getClients().filter(c => c.customerId === customerId);
export const deleteClient = (id: string): void => {
  const clients = loadData<Client>(CLIENTS_KEY).filter(c => c.id !== id);
  saveData(CLIENTS_KEY, clients);
};
export const saveInvoices = (invoices: Invoice[]): void => saveData(INVOICES_KEY, invoices);