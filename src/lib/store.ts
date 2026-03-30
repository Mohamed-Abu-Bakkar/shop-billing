import { Item, Customer, Invoice, Payment, Client } from '@/types';

function load<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}
function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Items
export function getItems(): Item[] { return load('vl_items', []); }
export function saveItems(items: Item[]) { save('vl_items', items); }
export function addItem(item: Item) { const items = getItems(); items.push(item); saveItems(items); }
export function updateItem(item: Item) { const items = getItems().map(i => i.id === item.id ? item : i); saveItems(items); }
export function deleteItem(id: string) { saveItems(getItems().filter(i => i.id !== id)); }

// Customers
export function getCustomers(): Customer[] { return load('vl_customers', []); }
export function saveCustomers(c: Customer[]) { save('vl_customers', c); }
export function addCustomer(c: Customer) { const cs = getCustomers(); cs.push(c); saveCustomers(cs); }
export function updateCustomer(c: Customer) { saveCustomers(getCustomers().map(x => x.id === c.id ? c : x)); }

// Invoices
export function getInvoices(): Invoice[] { return load('vl_invoices', []); }
export function saveInvoices(inv: Invoice[]) { save('vl_invoices', inv); }
export function addInvoice(inv: Invoice) { const all = getInvoices(); all.unshift(inv); saveInvoices(all); }

// Payments
export function getPayments(): Payment[] { return load('vl_payments', []); }
export function addPayment(p: Payment) { const all = getPayments(); all.unshift(p); save('vl_payments', all); }

// Clients
export function getClients(): Client[] { return load('vl_clients', []); }
export function getClientsByCustomer(customerId: string): Client[] { return getClients().filter(c => c.customerId === customerId); }
export function addClient(c: Client) { const all = getClients(); all.push(c); save('vl_clients', all); }
export function deleteClient(id: string) { save('vl_clients', getClients().filter(c => c.id !== id)); }

// Invoice updates
export function updateInvoice(inv: Invoice) { saveInvoices(getInvoices().map(i => i.id === inv.id ? inv : i)); }

// Helpers
export function generateId() { return Math.random().toString(36).substring(2, 10) + Date.now().toString(36); }
export function generateInvoiceNo() {
  const invoices = getInvoices();
  const num = invoices.length + 1;
  return `INV-${String(num).padStart(4, '0')}`;
}
