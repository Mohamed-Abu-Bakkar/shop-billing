import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  items: defineTable({
    id: v.string(),
    name: v.string(),
    brand: v.string(),
    category: v.string(),
    unit: v.string(),
    purchasePrice: v.number(),
    retailPrice: v.number(),
    wholesalePrice: v.number(),
    stock: v.number(),
    minStock: v.number(),
    warrantyMonths: v.number(),
    lastSoldAt: v.union(v.string(), v.null()),
    alternates: v.array(v.string()),
  }).index("by_app_id", ["id"]),

  customers: defineTable({
    id: v.string(),
    name: v.string(),
    phone: v.string(),
    isElectrician: v.boolean(),
    creditLimit: v.number(),
    totalCredit: v.number(),
    totalPaid: v.number(),
    behaviorScore: v.string(),
  }).index("by_app_id", ["id"]),

  invoices: defineTable({
    id: v.string(),
    invoiceNo: v.string(),
    type: v.string(),
    customerId: v.union(v.string(), v.null()),
    customerName: v.union(v.string(), v.null()),
    items: v.array(
      v.object({
        itemId: v.string(),
        name: v.string(),
        qty: v.number(),
        price: v.number(),
        discount: v.number(),
        warrantyExpiry: v.union(v.string(), v.null()),
      }),
    ),
    totalAmount: v.number(),
    paidAmount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    buyingForClient: v.union(v.string(), v.null()),
    createdAt: v.string(),
  })
    .index("by_app_id", ["id"])
    .index("by_created_at", ["createdAt"]),

  payments: defineTable({
    id: v.string(),
    customerId: v.string(),
    customerName: v.string(),
    amount: v.number(),
    method: v.string(),
    invoiceId: v.union(v.string(), v.null()),
    createdAt: v.string(),
  })
    .index("by_app_id", ["id"])
    .index("by_created_at", ["createdAt"]),

  clients: defineTable({
    id: v.string(),
    customerId: v.string(),
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    createdAt: v.string(),
  })
    .index("by_app_id", ["id"])
    .index("by_customer_id", ["customerId"]),

  meta: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),
});
