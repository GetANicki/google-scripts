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
  displayName?: string;
  phone?: string;
  email?: string;
  address?: Address;
}

export interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
}

export const OrderStatuses = [
  "Draft",
  "Confirmed",
  "Scheduled",
  "Delivered",
  "Invoiced",
  "Paid",
] as const;

export type OrderStatus = typeof OrderStatuses[number];

export type OrderFormEntry = Omit<
  {
    [T in CamelCase<OrderEntryColumn>]: string;
  },
  "timestamp"
> & {
  timestamp: Date;
};

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
  "Created By",
  "Timestamp",
  "Status",
  "Customer",
  "Service",
  "Pickup Date",
  "Pickup Location",
  "Pickup Comments",
  "Pickup Link",
  "Pickup Duration",
  "Drop-off Location",
  "Drop-off Phone Number",
  "Drop-off Comments",
  "Drop-off Duration",
  "Nicki",
  "Shopping Total",
  "Transaction",
  "Surcharge",
  "Service Price",
  "Nicki Gross",
  "Nicki Net",
] as const;
