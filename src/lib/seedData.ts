import { Item, Customer, Invoice, Payment, Client } from '@/types';
import { generateId } from './store';

const id = generateId;

const ITEMS: Item[] = [
  { id: id(), name: 'Havells Wire 1.5mm', brand: 'Havells', category: 'Wire', unit: 'mtr', purchasePrice: 18, retailPrice: 25, wholesalePrice: 21, stock: 500, minStock: 100, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 2 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Havells Wire 2.5mm', brand: 'Havells', category: 'Wire', unit: 'mtr', purchasePrice: 28, retailPrice: 38, wholesalePrice: 32, stock: 350, minStock: 100, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Polycab Wire 1.5mm', brand: 'Polycab', category: 'Wire', unit: 'mtr', purchasePrice: 16, retailPrice: 23, wholesalePrice: 19, stock: 400, minStock: 100, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 3 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Polycab Wire 4mm', brand: 'Polycab', category: 'Wire', unit: 'mtr', purchasePrice: 45, retailPrice: 60, wholesalePrice: 52, stock: 80, minStock: 50, warrantyMonths: 0, lastSoldAt: null, alternates: [] },
  { id: id(), name: 'Anchor Roma Switch', brand: 'Anchor', category: 'Switch', unit: 'pc', purchasePrice: 35, retailPrice: 55, wholesalePrice: 42, stock: 200, minStock: 50, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Legrand Switch 6A', brand: 'Legrand', category: 'Switch', unit: 'pc', purchasePrice: 45, retailPrice: 70, wholesalePrice: 55, stock: 150, minStock: 30, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 4 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'GM Switch 16A', brand: 'GM', category: 'Switch', unit: 'pc', purchasePrice: 30, retailPrice: 50, wholesalePrice: 38, stock: 12, minStock: 20, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 10 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Philips 9W LED Bulb', brand: 'Philips', category: 'Bulb', unit: 'pc', purchasePrice: 55, retailPrice: 90, wholesalePrice: 68, stock: 300, minStock: 50, warrantyMonths: 12, lastSoldAt: new Date().toISOString(), alternates: [] },
  { id: id(), name: 'Syska 12W LED Bulb', brand: 'Syska', category: 'Bulb', unit: 'pc', purchasePrice: 45, retailPrice: 80, wholesalePrice: 58, stock: 250, minStock: 50, warrantyMonths: 12, lastSoldAt: new Date(Date.now() - 2 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Wipro 15W LED Bulb', brand: 'Wipro', category: 'Bulb', unit: 'pc', purchasePrice: 60, retailPrice: 95, wholesalePrice: 72, stock: 8, minStock: 30, warrantyMonths: 12, lastSoldAt: new Date(Date.now() - 90 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Crompton Ceiling Fan', brand: 'Crompton', category: 'Fan', unit: 'pc', purchasePrice: 1100, retailPrice: 1650, wholesalePrice: 1350, stock: 15, minStock: 5, warrantyMonths: 24, lastSoldAt: new Date(Date.now() - 5 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Havells Ceiling Fan 1200mm', brand: 'Havells', category: 'Fan', unit: 'pc', purchasePrice: 1400, retailPrice: 2100, wholesalePrice: 1700, stock: 10, minStock: 5, warrantyMonths: 24, lastSoldAt: new Date(Date.now() - 7 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Crompton Table Fan', brand: 'Crompton', category: 'Fan', unit: 'pc', purchasePrice: 900, retailPrice: 1350, wholesalePrice: 1100, stock: 3, minStock: 5, warrantyMonths: 12, lastSoldAt: new Date(Date.now() - 70 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Kirloskar 1HP Motor', brand: 'Kirloskar', category: 'Motor', unit: 'pc', purchasePrice: 3500, retailPrice: 5200, wholesalePrice: 4200, stock: 4, minStock: 2, warrantyMonths: 12, lastSoldAt: new Date(Date.now() - 15 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'CRI 0.5HP Motor', brand: 'CRI', category: 'Motor', unit: 'pc', purchasePrice: 2200, retailPrice: 3300, wholesalePrice: 2700, stock: 6, minStock: 3, warrantyMonths: 12, lastSoldAt: new Date(Date.now() - 20 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Finolex PVC Pipe 1"', brand: 'Finolex', category: 'PVC', unit: 'mtr', purchasePrice: 30, retailPrice: 45, wholesalePrice: 36, stock: 200, minStock: 50, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 3 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Supreme PVC Pipe 3/4"', brand: 'Supreme', category: 'PVC', unit: 'mtr', purchasePrice: 22, retailPrice: 35, wholesalePrice: 28, stock: 180, minStock: 50, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 6 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'PVC Conduit Pipe 20mm', brand: 'Precision', category: 'PVC', unit: 'mtr', purchasePrice: 12, retailPrice: 20, wholesalePrice: 15, stock: 500, minStock: 100, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Havells MCB 16A SP', brand: 'Havells', category: 'MCB', unit: 'pc', purchasePrice: 120, retailPrice: 190, wholesalePrice: 150, stock: 50, minStock: 20, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 2 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Havells MCB 32A DP', brand: 'Havells', category: 'MCB', unit: 'pc', purchasePrice: 280, retailPrice: 420, wholesalePrice: 340, stock: 25, minStock: 10, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 8 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'L&T MCB 63A TP', brand: 'L&T', category: 'MCB', unit: 'pc', purchasePrice: 650, retailPrice: 950, wholesalePrice: 780, stock: 8, minStock: 5, warrantyMonths: 0, lastSoldAt: null, alternates: [] },
  { id: id(), name: 'Casing Capping 20mm', brand: 'Generic', category: 'Other', unit: 'mtr', purchasePrice: 8, retailPrice: 15, wholesalePrice: 11, stock: 1000, minStock: 200, warrantyMonths: 0, lastSoldAt: new Date().toISOString(), alternates: [] },
  { id: id(), name: 'Electrical Tape (Black)', brand: 'Biltuff', category: 'Other', unit: 'pc', purchasePrice: 12, retailPrice: 20, wholesalePrice: 15, stock: 400, minStock: 100, warrantyMonths: 0, lastSoldAt: new Date().toISOString(), alternates: [] },
  { id: id(), name: 'Junction Box 4x4', brand: 'Generic', category: 'Other', unit: 'pc', purchasePrice: 18, retailPrice: 30, wholesalePrice: 22, stock: 150, minStock: 50, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 4 * 86400000).toISOString(), alternates: [] },
  { id: id(), name: 'Ceiling Rose', brand: 'Anchor', category: 'Other', unit: 'pc', purchasePrice: 15, retailPrice: 28, wholesalePrice: 20, stock: 100, minStock: 30, warrantyMonths: 0, lastSoldAt: new Date(Date.now() - 5 * 86400000).toISOString(), alternates: [] },
];

const CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'Rajesh Kumar', phone: '9876543210', isElectrician: true, creditLimit: 100000, totalCredit: 15400, totalPaid: 42000, behaviorScore: 'Good' },
  { id: 'cust2', name: 'Suresh Electricals', phone: '9876543211', isElectrician: true, creditLimit: 200000, totalCredit: 38500, totalPaid: 125000, behaviorScore: 'Good' },
  { id: 'cust3', name: 'Amit Sharma', phone: '9876543212', isElectrician: false, creditLimit: 50000, totalCredit: 8200, totalPaid: 12000, behaviorScore: 'Regular' },
  { id: 'cust4', name: 'Vikram Singh', phone: '9876543213', isElectrician: true, creditLimit: 75000, totalCredit: 22000, totalPaid: 35000, behaviorScore: 'Late' },
  { id: 'cust5', name: 'Priya Constructions', phone: '9876543214', isElectrician: false, creditLimit: 150000, totalCredit: 45000, totalPaid: 80000, behaviorScore: 'Good' },
  { id: 'cust6', name: 'Mohammed Electricals', phone: '9876543215', isElectrician: true, creditLimit: 100000, totalCredit: 62000, totalPaid: 28000, behaviorScore: 'Risky' },
  { id: 'cust7', name: 'Ganesh Hardware', phone: '9876543216', isElectrician: false, creditLimit: 80000, totalCredit: 5600, totalPaid: 55000, behaviorScore: 'Good' },
  { id: 'cust8', name: 'Deepak Wiring Works', phone: '9876543217', isElectrician: true, creditLimit: 60000, totalCredit: 0, totalPaid: 18000, behaviorScore: 'Good' },
];

function makeDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

const INVOICES: Invoice[] = [
  { id: id(), invoiceNo: 'INV-0001', type: 'Wholesale', customerId: 'cust1', customerName: 'Rajesh Kumar', items: [
    { itemId: ITEMS[0].id, name: 'Havells Wire 1.5mm', qty: 100, price: 21, discount: 0, warrantyExpiry: null },
    { itemId: ITEMS[4].id, name: 'Anchor Roma Switch', qty: 20, price: 42, discount: 5, warrantyExpiry: null },
  ], totalAmount: 2898, paidAmount: 2000, paymentMethod: 'Mixed', status: 'Partial', buyingForClient: 'Mr. Verma - House wiring', createdAt: makeDaysAgo(1) },

  { id: id(), invoiceNo: 'INV-0002', type: 'Retail', customerId: null, customerName: null, items: [
    { itemId: ITEMS[7].id, name: 'Philips 9W LED Bulb', qty: 4, price: 90, discount: 0, warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString() },
  ], totalAmount: 360, paidAmount: 360, paymentMethod: 'UPI', status: 'Paid', buyingForClient: null, createdAt: makeDaysAgo(1) },

  { id: id(), invoiceNo: 'INV-0003', type: 'Wholesale', customerId: 'cust2', customerName: 'Suresh Electricals', items: [
    { itemId: ITEMS[10].id, name: 'Crompton Ceiling Fan', qty: 5, price: 1350, discount: 2, warrantyExpiry: new Date(Date.now() + 730 * 86400000).toISOString() },
    { itemId: ITEMS[18].id, name: 'Havells MCB 16A SP', qty: 10, price: 150, discount: 0, warrantyExpiry: null },
  ], totalAmount: 8115, paidAmount: 5000, paymentMethod: 'Mixed', status: 'Partial', buyingForClient: 'Green Valley Apartments - B Block', createdAt: makeDaysAgo(2) },

  { id: id(), invoiceNo: 'INV-0004', type: 'Retail', customerId: null, customerName: null, items: [
    { itemId: ITEMS[21].id, name: 'Casing Capping 20mm', qty: 50, price: 15, discount: 0, warrantyExpiry: null },
    { itemId: ITEMS[22].id, name: 'Electrical Tape (Black)', qty: 5, price: 20, discount: 0, warrantyExpiry: null },
  ], totalAmount: 850, paidAmount: 850, paymentMethod: 'Cash', status: 'Paid', buyingForClient: null, createdAt: makeDaysAgo(2) },

  { id: id(), invoiceNo: 'INV-0005', type: 'Wholesale', customerId: 'cust4', customerName: 'Vikram Singh', items: [
    { itemId: ITEMS[1].id, name: 'Havells Wire 2.5mm', qty: 200, price: 32, discount: 0, warrantyExpiry: null },
    { itemId: ITEMS[15].id, name: 'Finolex PVC Pipe 1"', qty: 50, price: 36, discount: 0, warrantyExpiry: null },
  ], totalAmount: 8200, paidAmount: 0, paymentMethod: 'Credit', status: 'Unpaid', buyingForClient: 'Patel Office Renovation', createdAt: makeDaysAgo(3) },

  { id: id(), invoiceNo: 'INV-0006', type: 'Wholesale', customerId: 'cust5', customerName: 'Priya Constructions', items: [
    { itemId: ITEMS[13].id, name: 'Kirloskar 1HP Motor', qty: 2, price: 4200, discount: 3, warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString() },
    { itemId: ITEMS[11].id, name: 'Havells Ceiling Fan 1200mm', qty: 8, price: 1700, discount: 5, warrantyExpiry: new Date(Date.now() + 730 * 86400000).toISOString() },
  ], totalAmount: 21068, paidAmount: 15000, paymentMethod: 'Mixed', status: 'Partial', buyingForClient: null, createdAt: makeDaysAgo(4) },

  { id: id(), invoiceNo: 'INV-0007', type: 'Retail', customerId: null, customerName: null, items: [
    { itemId: ITEMS[5].id, name: 'Legrand Switch 6A', qty: 10, price: 70, discount: 0, warrantyExpiry: null },
  ], totalAmount: 700, paidAmount: 700, paymentMethod: 'Cash', status: 'Paid', buyingForClient: null, createdAt: makeDaysAgo(5) },

  { id: id(), invoiceNo: 'INV-0008', type: 'Wholesale', customerId: 'cust6', customerName: 'Mohammed Electricals', items: [
    { itemId: ITEMS[0].id, name: 'Havells Wire 1.5mm', qty: 300, price: 21, discount: 0, warrantyExpiry: null },
    { itemId: ITEMS[2].id, name: 'Polycab Wire 1.5mm', qty: 200, price: 19, discount: 0, warrantyExpiry: null },
    { itemId: ITEMS[17].id, name: 'PVC Conduit Pipe 20mm', qty: 100, price: 15, discount: 0, warrantyExpiry: null },
  ], totalAmount: 11600, paidAmount: 0, paymentMethod: 'Credit', status: 'Unpaid', buyingForClient: 'City Mall Project', createdAt: makeDaysAgo(6) },

  { id: id(), invoiceNo: 'INV-0009', type: 'Retail', customerId: 'cust3', customerName: 'Amit Sharma', items: [
    { itemId: ITEMS[8].id, name: 'Syska 12W LED Bulb', qty: 6, price: 80, discount: 0, warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString() },
    { itemId: ITEMS[23].id, name: 'Junction Box 4x4', qty: 4, price: 30, discount: 0, warrantyExpiry: null },
  ], totalAmount: 600, paidAmount: 600, paymentMethod: 'UPI', status: 'Paid', buyingForClient: null, createdAt: makeDaysAgo(0) },

  { id: id(), invoiceNo: 'INV-0010', type: 'Wholesale', customerId: 'cust1', customerName: 'Rajesh Kumar', items: [
    { itemId: ITEMS[7].id, name: 'Philips 9W LED Bulb', qty: 50, price: 68, discount: 5, warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString() },
  ], totalAmount: 3230, paidAmount: 3230, paymentMethod: 'UPI', status: 'Paid', buyingForClient: 'Sharma Residence - Rewiring', createdAt: makeDaysAgo(0) },
];

const PAYMENTS: Payment[] = [
  { id: id(), customerId: 'cust1', customerName: 'Rajesh Kumar', amount: 5000, method: 'UPI', invoiceId: null, createdAt: makeDaysAgo(1) },
  { id: id(), customerId: 'cust2', customerName: 'Suresh Electricals', amount: 10000, method: 'Cash', invoiceId: null, createdAt: makeDaysAgo(2) },
  { id: id(), customerId: 'cust5', customerName: 'Priya Constructions', amount: 15000, method: 'Mixed', invoiceId: null, createdAt: makeDaysAgo(3) },
  { id: id(), customerId: 'cust7', customerName: 'Ganesh Hardware', amount: 8000, method: 'UPI', invoiceId: null, createdAt: makeDaysAgo(5) },
];

const CLIENTS: Client[] = [
  { id: 'cli1', customerId: 'cust1', name: 'Mr. Verma', phone: '9800000001', address: 'Sector 15, House wiring', createdAt: makeDaysAgo(30) },
  { id: 'cli2', customerId: 'cust1', name: 'Sharma Residence', phone: '9800000002', address: 'MG Road, Rewiring project', createdAt: makeDaysAgo(20) },
  { id: 'cli3', customerId: 'cust2', name: 'Green Valley Apartments', phone: '9800000003', address: 'NH Road, B Block', createdAt: makeDaysAgo(25) },
  { id: 'cli4', customerId: 'cust2', name: 'Sunrise School', phone: '9800000004', address: 'School Road, New building wiring', createdAt: makeDaysAgo(15) },
  { id: 'cli5', customerId: 'cust4', name: 'Patel Office', phone: '9800000005', address: 'Commercial Area, Renovation', createdAt: makeDaysAgo(10) },
  { id: 'cli6', customerId: 'cust6', name: 'City Mall Project', phone: '9800000006', address: 'Ring Road, New construction', createdAt: makeDaysAgo(8) },
  { id: 'cli7', customerId: 'cust6', name: 'Hotel Grand', phone: '9800000007', address: 'Station Road, Electrical maintenance', createdAt: makeDaysAgo(5) },
  { id: 'cli8', customerId: 'cust8', name: 'Agarwal House', phone: '9800000008', address: 'Colony Road, Full house wiring', createdAt: makeDaysAgo(3) },
];

export function seedDemoData() {
  const hasData = localStorage.getItem('vl_items');
  if (hasData) return false;

  localStorage.setItem('vl_items', JSON.stringify(ITEMS));
  localStorage.setItem('vl_customers', JSON.stringify(CUSTOMERS));
  localStorage.setItem('vl_invoices', JSON.stringify(INVOICES));
  localStorage.setItem('vl_payments', JSON.stringify(PAYMENTS));
  localStorage.setItem('vl_clients', JSON.stringify(CLIENTS));
  return true;
}
