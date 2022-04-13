import { CamelCase } from "type-fest";

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Product {
  id: string;
  attributes: Record<string, string>[];
  created: number;
  description: string | null;
  images: string[];
  metadata: Record<string, string>;
  name: string;
  type: string;
  updated: number;
  url: string | null;
}

export interface Subscription {
  id: string;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  collection_method: "charge_automatically";
  created: number | null;
  current_period_end: number | null;
  current_period_start: number | null;
  customer: string; // Customer[id]
  days_until_due: number | null;
  ended_at: number | null;
  metadata: Record<string, string>;
  plan: {
    id: string;
    active: boolean;
    nickname: null;
    product: string; // Product[id]
  };
  start_date: number | null;
  status: "active";
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
}

export interface SheetCustomer {
  __row?: number;
  customerId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  plan: string;
  address: string;
}

export const SheetCustomerColumns = [
  "Customer ID",
  "Display Name",
  "First Name",
  "Last Name",
  "Phone",
  "Email",
  "Plan",
  "Address",
] as const;

export type SheetCustomerColumn = typeof SheetCustomerColumns[number];

export interface Driver {
  driverId: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

export interface OrderDriver {
  orderNo: string;
  driverSerial: string;
}

export const OrderStatuses = [
  "Draft",
  "Confirmed",
  "In Optimo",
  "Delivered",
  "Invoiced",
  "Paid",
] as const;

export type OrderStatus = typeof OrderStatuses[number];

export const OrderPriorities = ["Low", "Medium", "High", "Critical"] as const;
export type OrderPriority = typeof OrderPriorities[number];

export interface OrderFormEntry {
  row: number;
  orderId: string;
  status: OrderStatus;
  customerId: string;
  nickiId: string;
  timestamp: Date;
  customer: string;
  service: string;
  pickupDate: Date | null;
  pickupLocation: string;
  pickupComments: string;
  dropOffLocation: string;
  dropOffComments: string;
  attachment: string;
  nicki: string;
}

/**
 * the column names from the Order Entry spreadsheet
 */
export type OrderEntryColumn = typeof OrderEntryColumns[number];

/**
 * the column names from the Order Entry spreadsheet
 */
export const OrderEntryColumns = [
  "Order ID",
  "Customer ID",
  "Nicki ID",
  "Service ID",
  "Created",
  "Timestamp",
  "Status",
  "Customer",
  "Membership",
  "Service",
  "Attachment",
  "Picked Up UTC",
  "Pickup Date",
  "Pickup Location",
  "Pickup Comments",
  "Pickup Link",
  "Pickup Duration",
  "Priority",
  "New Pickup Location",
  "Drop-off Location",
  "Drop-off Phone Number",
  "Drop-off Comments",
  "Drop-off Duration",
  "New Drop-off Location",
  "Delivered UTC",
  "Receipt",
  "Nicki",
  "Shopping Total",
  "Transaction",
  "Surcharge",
  "Service Price",
  "Nicki Gross",
  "Nicki Net",
] as const;

export interface Location {
  address: string;
  latitude?: number;
  longitude?: number;
  locationNo?: string;
  locationName?: string;
}

/**
 * Auditing and logging
 */
export const AuditEntryTypes = [
  "Error",
  "Message",
  "Notification",
  "Change",
] as const;
export type AuditEntryType = typeof AuditEntryTypes[number];

export interface AuditEntry {
  timestamp?: string;
  type: AuditEntryType;
}

export interface MessageAuditEntry extends AuditEntry {
  type: "Error" | "Message" | "Notification";
  message: string;
  details?: string;
  stack?: string;
}

export interface ValueChangeAuditEntry extends AuditEntry {
  type: "Change";
  sheet?: string;
  column: string;
  newValue: string;
  oldValue?: string;
}

export type Row<T> = T & { __row: number };
