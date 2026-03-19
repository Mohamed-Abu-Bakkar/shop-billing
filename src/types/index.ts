export type Category = 'Wire' | 'Switch' | 'Bulb' | 'Fan' | 'Motor' | 'PVC' | 'MCB' | 'Other';
export type Unit = 'pc' | 'mtr' | 'box' | 'pkt';
export type PaymentMethod = 'Cash' | 'UPI' | 'Mixed' | 'Credit';
export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid';
export type BehaviorScore = 'Good' | 'Regular' | 'Late' | 'Risky';

export interface Item {
  id: string;
  name: string;
  brand: string;
  category: Category;
  unit: Unit;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  minStock: number;
  warrantyMonths: number;
  lastSoldAt: string | null;
  alternates: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  isElectrician: boolean;
  creditLimit: number;
  totalCredit: number;
  totalPaid: number;
  behaviorScore: BehaviorScore;
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  qty: number;
  price: number;
  discount: number;
  warrantyExpiry: string | null;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: 'Retail' | 'Wholesale';
  customerId: string | null;
  customerName: string | null;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Mixed';
  invoiceId: string | null;
  createdAt: string;
}
