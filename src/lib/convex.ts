import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { Client, Customer, Invoice, Item, Payment } from "@/types";

type EmptyArgs = Record<string, never>;

type ShopApi = {
  getBootstrap: FunctionReference<"query", "public", EmptyArgs, { isSeeded: boolean }>;
  seedDemoData: FunctionReference<"mutation", "public", EmptyArgs, { seeded: boolean }>;
  listItems: FunctionReference<"query", "public", EmptyArgs, Item[]>;
  createItem: FunctionReference<"mutation", "public", { item: Item }, Item>;
  updateItem: FunctionReference<"mutation", "public", { item: Item }, Item>;
  deleteItem: FunctionReference<"mutation", "public", { id: string }, { deleted: boolean }>;
  listCustomers: FunctionReference<"query", "public", EmptyArgs, Customer[]>;
  createCustomer: FunctionReference<"mutation", "public", { customer: Customer }, Customer>;
  updateCustomer: FunctionReference<"mutation", "public", { customer: Customer }, Customer>;
  deleteCustomer: FunctionReference<"mutation", "public", { id: string }, { deleted: boolean }>;
  listInvoices: FunctionReference<"query", "public", EmptyArgs, Invoice[]>;
  listPayments: FunctionReference<"query", "public", EmptyArgs, Payment[]>;
  listClientsByCustomer: FunctionReference<"query", "public", { customerId: string }, Client[]>;
  createClient: FunctionReference<"mutation", "public", { client: Client }, Client>;
  updateClient: FunctionReference<"mutation", "public", { client: Client }, Client>;
  deleteClient: FunctionReference<"mutation", "public", { id: string }, { deleted: boolean }>;
  createInvoice: FunctionReference<
    "mutation",
    "public",
    { invoice: Omit<Invoice, "invoiceNo"> & { invoiceNo?: string }; templateType: string },
    Invoice
  >;
  applyCustomerPayment: FunctionReference<
    "mutation",
    "public",
    { payment: Payment; invoiceId: string | null },
    { success: boolean }
  >;
};

export const shopApi: ShopApi = {
  getBootstrap: makeFunctionReference("shop:getBootstrap"),
  seedDemoData: makeFunctionReference("shop:seedDemoData"),
  listItems: makeFunctionReference("shop:listItems"),
  createItem: makeFunctionReference("shop:createItem"),
  updateItem: makeFunctionReference("shop:updateItem"),
  deleteItem: makeFunctionReference("shop:deleteItem"),
  listCustomers: makeFunctionReference("shop:listCustomers"),
  createCustomer: makeFunctionReference("shop:createCustomer"),
  updateCustomer: makeFunctionReference("shop:updateCustomer"),
  deleteCustomer: makeFunctionReference("shop:deleteCustomer"),
  listInvoices: makeFunctionReference("shop:listInvoices"),
  listPayments: makeFunctionReference("shop:listPayments"),
  listClientsByCustomer: makeFunctionReference("shop:listClientsByCustomer"),
  createClient: makeFunctionReference("shop:createClient"),
  updateClient: makeFunctionReference("shop:updateClient"),
  deleteClient: makeFunctionReference("shop:deleteClient"),
  createInvoice: makeFunctionReference("shop:createInvoice"),
  applyCustomerPayment: makeFunctionReference("shop:applyCustomerPayment"),
};
