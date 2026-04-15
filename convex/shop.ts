import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { seedClients, seedCustomers, seedInvoices, seedItems, seedPayments } from "./seedData";

const invoiceItemValidator = v.object({
  itemId: v.string(),
  name: v.string(),
  qty: v.number(),
  price: v.number(),
  discount: v.number(),
  warrantyExpiry: v.union(v.string(), v.null()),
});

const itemValidator = v.object({
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
});

const customerValidator = v.object({
  id: v.string(),
  name: v.string(),
  phone: v.string(),
  isElectrician: v.boolean(),
  creditLimit: v.number(),
  totalCredit: v.number(),
  totalPaid: v.number(),
  behaviorScore: v.string(),
});

const clientValidator = v.object({
  id: v.string(),
  customerId: v.string(),
  name: v.string(),
  phone: v.string(),
  address: v.string(),
  createdAt: v.string(),
});

const invoiceValidator = v.object({
  id: v.string(),
  invoiceNo: v.string(),
  type: v.string(),
  customerId: v.union(v.string(), v.null()),
  customerName: v.union(v.string(), v.null()),
  items: v.array(invoiceItemValidator),
  totalAmount: v.number(),
  paidAmount: v.number(),
  paymentMethod: v.string(),
  status: v.string(),
  buyingForClient: v.union(v.string(), v.null()),
  createdAt: v.string(),
});

const paymentValidator = v.object({
  id: v.string(),
  customerId: v.string(),
  customerName: v.string(),
  amount: v.number(),
  method: v.string(),
  invoiceId: v.union(v.string(), v.null()),
  createdAt: v.string(),
});

async function getItemById(ctx: MutationCtx, id: string) {
  return await ctx.db.query("items").withIndex("by_app_id", (q) => q.eq("id", id)).unique();
}

async function getCustomerById(ctx: MutationCtx, customerId: string) {
  return await ctx.db.query("customers").withIndex("by_app_id", (q) => q.eq("id", customerId)).unique();
}

async function getInvoiceById(ctx: MutationCtx, id: string) {
  return await ctx.db.query("invoices").withIndex("by_app_id", (q) => q.eq("id", id)).unique();
}

async function getClientById(ctx: MutationCtx, id: string) {
  return await ctx.db.query("clients").withIndex("by_app_id", (q) => q.eq("id", id)).unique();
}

async function getInvoiceCounterDoc(ctx: MutationCtx) {
  return await ctx.db.query("meta").withIndex("by_key", (q) => q.eq("key", "invoiceCounter")).unique();
}

async function nextInvoiceNumber(ctx: MutationCtx) {
  const counter = await getInvoiceCounterDoc(ctx);
  const nextValue = (counter?.value ?? 0) + 1;
  if (counter) {
    await ctx.db.patch(counter._id, { value: nextValue });
  } else {
    await ctx.db.insert("meta", { key: "invoiceCounter", value: nextValue });
  }
  return `INV-${String(nextValue).padStart(4, "0")}`;
}

export const getBootstrap = query({
  args: {},
  handler: async (ctx) => {
    const itemCount = (await ctx.db.query("items").collect()).length;
    return { isSeeded: itemCount > 0 };
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingItems = await ctx.db.query("items").take(1);
    if (existingItems.length > 0) {
      return { seeded: false };
    }

    for (const item of seedItems) {
      await ctx.db.insert("items", item);
    }
    for (const customer of seedCustomers) {
      await ctx.db.insert("customers", customer);
    }
    for (const client of seedClients) {
      await ctx.db.insert("clients", client);
    }
    for (const invoice of seedInvoices) {
      await ctx.db.insert("invoices", invoice);
    }
    for (const payment of seedPayments) {
      await ctx.db.insert("payments", payment);
    }
    await ctx.db.insert("meta", { key: "invoiceCounter", value: seedInvoices.length });

    return { seeded: true };
  },
});

export const listItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createItem = mutation({
  args: { item: itemValidator },
  handler: async (ctx, { item }) => {
    await ctx.db.insert("items", item);
    return item;
  },
});

export const updateItem = mutation({
  args: { item: itemValidator },
  handler: async (ctx, { item }) => {
    const existing = await getItemById(ctx, item.id);
    if (!existing) {
      throw new Error("Item not found");
    }
    await ctx.db.patch(existing._id, item);
    return item;
  },
});

export const deleteItem = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const existing = await getItemById(ctx, id);
    if (!existing) {
      return { deleted: false };
    }
    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const listCustomers = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    return customers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createCustomer = mutation({
  args: { customer: customerValidator },
  handler: async (ctx, { customer }) => {
    await ctx.db.insert("customers", customer);
    return customer;
  },
});

export const updateCustomer = mutation({
  args: { customer: customerValidator },
  handler: async (ctx, { customer }) => {
    const existing = await getCustomerById(ctx, customer.id);
    if (!existing) {
      throw new Error("Customer not found");
    }
    await ctx.db.patch(existing._id, customer);
    return customer;
  },
});

export const listInvoices = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").collect();
    return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();
    return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

export const listClientsByCustomer = query({
  args: { customerId: v.string() },
  handler: async (ctx, { customerId }) => {
    const clients = await ctx.db.query("clients").withIndex("by_customer_id", (q) => q.eq("customerId", customerId)).collect();
    return clients.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createClient = mutation({
  args: { client: clientValidator },
  handler: async (ctx, { client }) => {
    await ctx.db.insert("clients", client);
    return client;
  },
});

export const deleteClient = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const existing = await getClientById(ctx, id);
    if (!existing) {
      return { deleted: false };
    }
    await ctx.db.delete(existing._id);
    return { deleted: true };
  },
});

export const createInvoice = mutation({
  args: {
    invoice: invoiceValidator,
    templateType: v.string(),
  },
  handler: async (ctx, { invoice, templateType }) => {
    const finalizedInvoice =
      templateType === "quotation"
        ? {
            ...invoice,
            invoiceNo: `QUOTATION-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
          }
        : {
            ...invoice,
            invoiceNo: await nextInvoiceNumber(ctx),
          };

    if (templateType === "bill") {
      for (const billItem of finalizedInvoice.items) {
        const itemDoc = await getItemById(ctx, billItem.itemId);
        if (!itemDoc) {
          throw new Error(`Item ${billItem.itemId} not found`);
        }
        await ctx.db.patch(itemDoc._id, {
          stock: itemDoc.stock - billItem.qty,
          lastSoldAt: finalizedInvoice.createdAt,
        });
      }

      if (finalizedInvoice.customerId && finalizedInvoice.status !== "Paid") {
        const customer = await getCustomerById(ctx, finalizedInvoice.customerId);
        if (customer) {
          const unpaid = finalizedInvoice.totalAmount - finalizedInvoice.paidAmount;
          await ctx.db.patch(customer._id, {
            totalCredit: customer.totalCredit + unpaid,
          });
        }
      }

      await ctx.db.insert("invoices", finalizedInvoice);
    }

    return finalizedInvoice;
  },
});

export const applyCustomerPayment = mutation({
  args: {
    payment: paymentValidator,
    invoiceId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { payment, invoiceId }) => {
    const customer = await getCustomerById(ctx, payment.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    if (invoiceId) {
      const invoice = await getInvoiceById(ctx, invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      const newPaidAmount = Math.min(invoice.totalAmount, invoice.paidAmount + payment.amount);
      await ctx.db.patch(invoice._id, {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= invoice.totalAmount ? "Paid" : "Partial",
      });
    }

    await ctx.db.insert("payments", payment);
    await ctx.db.patch(customer._id, {
      totalCredit: Math.max(0, customer.totalCredit - payment.amount),
      totalPaid: customer.totalPaid + payment.amount,
    });

    return { success: true };
  },
});
