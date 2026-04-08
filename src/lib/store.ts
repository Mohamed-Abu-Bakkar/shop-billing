import { Item, Customer, Invoice, Payment, Client } from '@/types';
import * as db from './db';

export function getItems(): Item[] { return db.getItems(); }
export function addItem(item: Item) { db.addItem(item); }
export function updateItem(item: Item) { db.updateItem(item); }
export function deleteItem(id: string) { db.deleteItem(id); }

export function getCustomers(): Customer[] { return db.getCustomers(); }
export function addCustomer(c: Customer) { db.addCustomer(c); }
export function updateCustomer(c: Customer) { db.updateCustomer(c); }

export function getInvoices(): Invoice[] { return db.getInvoices(); }
export function addInvoice(inv: Invoice) { db.addInvoice(inv); }

export function getPayments(): Payment[] { return db.getPayments(); }
export function addPayment(p: Payment) { db.addPayment(p); }
export function getCustomerPayments(customerId: string): Payment[] { return db.getCustomerPayments(customerId); }

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Clients
export function getClients(): Client[] { return db.getClients(); }
export function getClientsByCustomer(customerId: string): Client[] { return db.getClientsByCustomer(customerId); }
export function addClient(c: Client) { db.addClient(c); }
export function deleteClient(id: string) { db.deleteClient(id); }

// Invoice updates
export function updateInvoice(inv: Invoice) { db.saveInvoices(getInvoices().map(i => i.id === inv.id ? inv : i)); }

// Helpers
export function generateInvoiceNo() {
  const invoices = getInvoices();
  const num = invoices.length + 1;
  return `INV-${String(num).padStart(4, '0')}`;
}

export async function initStore(): Promise<void> {
  await db.initDb();
}