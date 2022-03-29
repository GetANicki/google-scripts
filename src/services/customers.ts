import { Customer } from "../shared/types";
import { get, getAll } from "./stripe";

const cache: Record<string, Customer> = {};

export const getCustomerById = (customerId: string): Customer | null => {
  if (cache[customerId]) return cache[customerId];

  const customer = get<Customer>(`/customers/${customerId}`);

  if (customer) {
    cache[customer.id] = customer;
    return customer;
  }

  return null;
};

export const getCustomers = (): Customer[] => {
  const custmers = getAll<Customer>("/customers", { limit: 100 }).sort((x, y) =>
    x.displayName! > y.displayName! ? 1 : -1,
  );

  for (const c of custmers) {
    cache[c.id] = c;
  }

  return custmers;
};
