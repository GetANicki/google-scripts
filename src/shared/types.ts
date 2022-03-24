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
  address?: string;
}

export interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
}

export const OrderStatuses = [
  "Draft",
  "Scheduled",
  "Delivered",
  "Invoiced",
  "Paid",
] as const;

export type OrderStatus = typeof OrderStatuses[number];

export interface OrderFormEntry {
  orderId: string;
  customerId: string;
  nickiId: string;
  timestamp: Date;
  customer: string;
  service: string;
  pickupLocation: string;
  pickupComments: string;
  dropOffLocation: string;
  dropOffComments: string;
  nicki: string;
}
