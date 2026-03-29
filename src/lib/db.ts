import initSqlJs, { Database } from 'sql.js';
import { Item, Customer, Invoice, Payment } from '@/types';

let db: Database | null = null;
const DB_KEY = 'vl_sqlite_db';

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm')) {
        return 'https://sql.js.org/dist/sql-wasm.wasm';
      }
      return `https://sql.js.org/dist/${file}`;
    },
  });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    const data = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
    createTables();
    addSeedData();
  }
  saveDb();
}

function createTables(): void {
  if (!db) return;
  
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      unit TEXT,
      purchasePrice REAL,
      retailPrice REAL,
      wholesalePrice REAL,
      stock INTEGER,
      minStock INTEGER,
      warrantyMonths INTEGER,
      lastSoldAt TEXT,
      alternates TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      isElectrician INTEGER,
      creditLimit REAL,
      totalCredit REAL,
      totalPaid REAL,
      behaviorScore TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoiceNo TEXT,
      type TEXT,
      customerId TEXT,
      customerName TEXT,
      items TEXT,
      totalAmount REAL,
      paidAmount REAL,
      paymentMethod TEXT,
      status TEXT,
      buyingForClient TEXT,
      createdAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      customerId TEXT,
      customerName TEXT,
      amount REAL,
      method TEXT,
      invoiceId TEXT,
      createdAt TEXT
    )
  `);
}

function addSeedData(): void {
  if (!db) return;
  
  const existingItems = db.exec("SELECT COUNT(*) FROM items")[0]?.values[0]?.[0] as number;
  if (existingItems > 0) return;

  const items = [
    { id: "i1", name: "LED Bulb 9W", brand: "Philips", category: "Bulb", unit: "pc", purchasePrice: 45, retailPrice: 75, wholesalePrice: 60, stock: 500, minStock: 50, warrantyMonths: 12 },
    { id: "i2", name: "LED Tube 20W", brand: "Syska", category: "Bulb", unit: "pc", purchasePrice: 120, retailPrice: 180, wholesalePrice: 150, stock: 200, minStock: 30, warrantyMonths: 24 },
    { id: "i3", name: "Ceiling Fan 1200mm", brand: "Havells", category: "Fan", unit: "pc", purchasePrice: 1400, retailPrice: 2200, wholesalePrice: 1800, stock: 25, minStock: 5, warrantyMonths: 24 },
    { id: "i4", name: " exhaust Fan 300mm", brand: "Crompton", category: "Fan", unit: "pc", purchasePrice: 800, retailPrice: 1200, wholesalePrice: 950, stock: 40, minStock: 10, warrantyMonths: 12 },
    { id: "i5", name: "Copper Wire 1.5sqmm", brand: "Finolex", category: "Wire", unit: "mtr", purchasePrice: 18, retailPrice: 28, wholesalePrice: 22, stock: 5000, minStock: 500, warrantyMonths: 0 },
    { id: "i6", name: "Copper Wire 2.5sqmm", brand: "Finolex", category: "Wire", unit: "mtr", purchasePrice: 28, retailPrice: 42, wholesalePrice: 35, stock: 3000, minStock: 300, warrantyMonths: 0 },
    { id: "i7", name: "Copper Wire 4sqmm", brand: "Finolex", category: "Wire", unit: "mtr", purchasePrice: 45, retailPrice: 65, wholesalePrice: 55, stock: 2000, minStock: 200, warrantyMonths: 0 },
    { id: "i8", name: "MCB 16A Single", brand: "Schneider", category: "MCB", unit: "pc", purchasePrice: 120, retailPrice: 180, wholesalePrice: 150, stock: 100, minStock: 20, warrantyMonths: 36 },
    { id: "i9", name: "MCB 32A Double", brand: "Schneider", category: "MCB", unit: "pc", purchasePrice: 180, retailPrice: 260, wholesalePrice: 220, stock: 80, minStock: 15, warrantyMonths: 36 },
    { id: "i10", name: "Switch Socket 6A", brand: "Anchor", category: "Switch", unit: "pc", purchasePrice: 35, retailPrice: 55, wholesalePrice: 45, stock: 300, minStock: 50, warrantyMonths: 12 },
    { id: "i11", name: "Motor Pump 1HP", brand: "Kirloskar", category: "Motor", unit: "pc", purchasePrice: 4500, retailPrice: 6500, wholesalePrice: 5500, stock: 8, minStock: 2, warrantyMonths: 24 },
    { id: "i12", name: "PVC Conduit 25mm", brand: "Supreme", category: "PVC", unit: "mtr", purchasePrice: 25, retailPrice: 38, wholesalePrice: 30, stock: 1000, minStock: 100, warrantyMonths: 0 },
  ];

  items.forEach(item => {
    db!.run(
      "INSERT INTO items (id, name, brand, category, unit, purchasePrice, retailPrice, wholesalePrice, stock, minStock, warrantyMonths, lastSoldAt, alternates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [item.id, item.name, item.brand, item.category, item.unit, item.purchasePrice, item.retailPrice, item.wholesalePrice, item.stock, item.minStock, item.warrantyMonths, null, "[]"]
    );
  });

  const customers = [
    { id: "c1", name: "Ramesh Kumar", phone: "9876543210", isElectrician: true, creditLimit: 50000, totalCredit: 15000, totalPaid: 35000, behaviorScore: "Good" },
    { id: "c2", name: "Suresh Patel", phone: "9876543211", isElectrician: true, creditLimit: 75000, totalCredit: 25000, totalPaid: 50000, behaviorScore: "Good" },
    { id: "c3", name: "Gopal Electricals", phone: "9876543212", isElectrician: false, creditLimit: 100000, totalCredit: 0, totalPaid: 120000, behaviorScore: "Good" },
    { id: "c4", name: "Mohan Singh", phone: "9876543213", isElectrician: false, creditLimit: 30000, totalCredit: 12000, totalPaid: 18000, behaviorScore: "Late" },
    { id: "c5", name: "Ajay Kumar", phone: "9876543214", isElectrician: true, creditLimit: 40000, totalCredit: 8000, totalPaid: 22000, behaviorScore: "Good" },
  ];

  customers.forEach(c => {
    db!.run(
      "INSERT INTO customers (id, name, phone, isElectrician, creditLimit, totalCredit, totalPaid, behaviorScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [c.id, c.name, c.phone, c.isElectrician ? 1 : 0, c.creditLimit, c.totalCredit, c.totalPaid, c.behaviorScore]
    );
  });
}

function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_KEY, base64);
}

function migrateFromLocalStorage(): void {
  if (!db) return;

  const items = localStorage.getItem('vl_items');
  const customers = localStorage.getItem('vl_customers');
  const invoices = localStorage.getItem('vl_invoices');
  const payments = localStorage.getItem('vl_payments');

  if (items && items !== '[]') {
    const parsed = JSON.parse(items) as Item[];
    const count = db.exec("SELECT COUNT(*) FROM items")[0]?.values[0]?.[0] as number;
    if (count === 0) {
      parsed.forEach(item => {
        db!.run(
          "INSERT INTO items (id, name, brand, category, unit, purchasePrice, retailPrice, wholesalePrice, stock, minStock, warrantyMonths, lastSoldAt, alternates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [item.id, item.name, item.brand, item.category, item.unit, item.purchasePrice, item.retailPrice, item.wholesalePrice, item.stock, item.minStock, item.warrantyMonths, item.lastSoldAt, JSON.stringify(item.alternates)]
        );
      });
    }
    localStorage.removeItem('vl_items');
  }

  if (customers && customers !== '[]') {
    const parsed = JSON.parse(customers) as Customer[];
    const count = db.exec("SELECT COUNT(*) FROM customers")[0]?.values[0]?.[0] as number;
    if (count === 0) {
      parsed.forEach(c => {
        db!.run(
          "INSERT INTO customers (id, name, phone, isElectrician, creditLimit, totalCredit, totalPaid, behaviorScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [c.id, c.name, c.phone, c.isElectrician ? 1 : 0, c.creditLimit, c.totalCredit, c.totalPaid, c.behaviorScore]
        );
      });
    }
    localStorage.removeItem('vl_customers');
  }

  if (invoices && invoices !== '[]') {
    const parsed = JSON.parse(invoices) as Invoice[];
    const count = db.exec("SELECT COUNT(*) FROM invoices")[0]?.values[0]?.[0] as number;
    if (count === 0) {
      parsed.forEach(inv => {
        db!.run(
          "INSERT INTO invoices (id, invoiceNo, type, customerId, customerName, items, totalAmount, paidAmount, paymentMethod, status, buyingForClient, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [inv.id, inv.invoiceNo, inv.type, inv.customerId, inv.customerName, JSON.stringify(inv.items), inv.totalAmount, inv.paidAmount, inv.paymentMethod, inv.status, inv.buyingForClient, inv.createdAt]
        );
      });
    }
    localStorage.removeItem('vl_invoices');
  }

  if (payments && payments !== '[]') {
    const parsed = JSON.parse(payments) as Payment[];
    const count = db.exec("SELECT COUNT(*) FROM payments")[0]?.values[0]?.[0] as number;
    if (count === 0) {
      parsed.forEach(p => {
        db!.run(
          "INSERT INTO payments (id, customerId, customerName, amount, method, invoiceId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.customerId, p.customerName, p.amount, p.method, p.invoiceId, p.createdAt]
        );
      });
    }
    localStorage.removeItem('vl_payments');
  }

  saveDb();
}

export function getItems(): Item[] {
  if (!db) return [];
  const results = db.exec("SELECT * FROM items ORDER BY name");
  if (!results[0]) return [];
  
  return results[0].values.map(row => ({
    id: row[0] as string,
    name: row[1] as string,
    brand: row[2] as string,
    category: row[3] as Item['category'],
    unit: row[4] as Item['unit'],
    purchasePrice: row[5] as number,
    retailPrice: row[6] as number,
    wholesalePrice: row[7] as number,
    stock: row[8] as number,
    minStock: row[9] as number,
    warrantyMonths: row[10] as number,
    lastSoldAt: row[11] as string | null,
    alternates: JSON.parse(row[12] as string || '[]'),
  }));
}

export function addItem(item: Item): void {
  if (!db) return;
  db.run(
    "INSERT INTO items (id, name, brand, category, unit, purchasePrice, retailPrice, wholesalePrice, stock, minStock, warrantyMonths, lastSoldAt, alternates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [item.id, item.name, item.brand, item.category, item.unit, item.purchasePrice, item.retailPrice, item.wholesalePrice, item.stock, item.minStock, item.warrantyMonths, item.lastSoldAt, JSON.stringify(item.alternates)]
  );
  saveDb();
}

export function updateItem(item: Item): void {
  if (!db) return;
  db.run(
    "UPDATE items SET name=?, brand=?, category=?, unit=?, purchasePrice=?, retailPrice=?, wholesalePrice=?, stock=?, minStock=?, warrantyMonths=?, lastSoldAt=?, alternates=? WHERE id=?",
    [item.name, item.brand, item.category, item.unit, item.purchasePrice, item.retailPrice, item.wholesalePrice, item.stock, item.minStock, item.warrantyMonths, item.lastSoldAt, JSON.stringify(item.alternates), item.id]
  );
  saveDb();
}

export function deleteItem(id: string): void {
  if (!db) return;
  db.run("DELETE FROM items WHERE id=?", [id]);
  saveDb();
}

export function getCustomers(): Customer[] {
  if (!db) return [];
  const results = db.exec("SELECT * FROM customers ORDER BY name");
  if (!results[0]) return [];
  
  return results[0].values.map(row => ({
    id: row[0] as string,
    name: row[1] as string,
    phone: row[2] as string,
    isElectrician: !!row[3],
    creditLimit: row[4] as number,
    totalCredit: row[5] as number,
    totalPaid: row[6] as number,
    behaviorScore: row[7] as Customer['behaviorScore'],
  }));
}

export function addCustomer(c: Customer): void {
  if (!db) return;
  db.run(
    "INSERT INTO customers (id, name, phone, isElectrician, creditLimit, totalCredit, totalPaid, behaviorScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [c.id, c.name, c.phone, c.isElectrician ? 1 : 0, c.creditLimit, c.totalCredit, c.totalPaid, c.behaviorScore]
  );
  saveDb();
}

export function updateCustomer(c: Customer): void {
  if (!db) return;
  db.run(
    "UPDATE customers SET name=?, phone=?, isElectrician=?, creditLimit=?, totalCredit=?, totalPaid=?, behaviorScore=? WHERE id=?",
    [c.name, c.phone, c.isElectrician ? 1 : 0, c.creditLimit, c.totalCredit, c.totalPaid, c.behaviorScore, c.id]
  );
  saveDb();
}

export function getInvoices(): Invoice[] {
  if (!db) return [];
  const results = db.exec("SELECT * FROM invoices ORDER BY createdAt DESC");
  if (!results[0]) return [];
  
  return results[0].values.map(row => ({
    id: row[0] as string,
    invoiceNo: row[1] as string,
    type: row[2] as Invoice['type'],
    customerId: row[3] as string | null,
    customerName: row[4] as string | null,
    items: JSON.parse(row[5] as string || '[]'),
    totalAmount: row[6] as number,
    paidAmount: row[7] as number,
    paymentMethod: row[8] as Invoice['paymentMethod'],
    status: row[9] as Invoice['status'],
    buyingForClient: row[10] as string | null,
    createdAt: row[11] as string,
  }));
}

export function addInvoice(inv: Invoice): void {
  if (!db) return;
  db.run(
    "INSERT INTO invoices (id, invoiceNo, type, customerId, customerName, items, totalAmount, paidAmount, paymentMethod, status, buyingForClient, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [inv.id, inv.invoiceNo, inv.type, inv.customerId, inv.customerName, JSON.stringify(inv.items), inv.totalAmount, inv.paidAmount, inv.paymentMethod, inv.status, inv.buyingForClient, inv.createdAt]
  );
  saveDb();
}

export function getPayments(): Payment[] {
  if (!db) return [];
  const results = db.exec("SELECT * FROM payments ORDER BY createdAt DESC");
  if (!results[0]) return [];
  
  return results[0].values.map(row => ({
    id: row[0] as string,
    customerId: row[1] as string,
    customerName: row[2] as string,
    amount: row[3] as number,
    method: row[4] as Payment['method'],
    invoiceId: row[5] as string | null,
    createdAt: row[6] as string,
  }));
}

export function addPayment(p: Payment): void {
  if (!db) return;
  db.run(
    "INSERT INTO payments (id, customerId, customerName, amount, method, invoiceId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [p.id, p.customerId, p.customerName, p.amount, p.method, p.invoiceId, p.createdAt]
  );
  saveDb();
}

export function getCustomerPayments(customerId: string): Payment[] {
  if (!db) return [];
  const results = db.exec("SELECT * FROM payments WHERE customerId = ? ORDER BY createdAt DESC", [customerId]);
  if (!results[0]) return [];
  
  return results[0].values.map(row => ({
    id: row[0] as string,
    customerId: row[1] as string,
    customerName: row[2] as string,
    amount: row[3] as number,
    method: row[4] as Payment['method'],
    invoiceId: row[5] as string | null,
    createdAt: row[6] as string,
  }));
}