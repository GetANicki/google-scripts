export type Address = any;

export type Product = any;

export type Subscription = any;

export interface Customer {
  id: string;
  name: string;
  displayName?: string;
  phone?: string;
  email?: string;
  plan?: string;
  activePlan?: Product;
  products?: Product[];
  subscriptions?: Subscription[];
  address?: string;
}
