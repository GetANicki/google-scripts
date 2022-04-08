import { getCustomers } from "../../services/customers";
import {
  getActivePlan,
  getProducts,
  getSubscriptions,
} from "../../services/stripe";
import { updateListField } from "../../shared/googleExt";
import {
  Customer,
  OrderEntryColumn,
  Product,
  Subscription,
} from "../../shared/types";

export function syncCustomerFormField(form: GoogleAppsScript.Forms.Form) {
  const products = getProducts();
  const subscriptions = getSubscriptions();
  const customers = getCustomers();

  updateCustomerField(form, customers, products, subscriptions);
}

const updateCustomerField = (
  form: GoogleAppsScript.Forms.Form,
  customers: Customer[],
  products: Product[],
  subscriptions: Subscription[],
) => {
  const customerNames = [
    ...new Set(
      customers
        .map(
          (x) =>
            [x, getActivePlan(x, products, subscriptions)] as [
              Customer,
              Product | null,
            ],
        )
        .map(([customer, plan]) =>
          [
            customer.name,
            customer.address?.line1 ? "" : "<NO ADDR>",
            plan ? `[${plan.name}]` : "",
            `(${customer.id})`,
          ]
            .filter((x) => !!x)
            .join(" "),
        )
        .filter((x) => !!x)
        .sort(),
    ),
  ];
  updateListField<OrderEntryColumn>(form, "Customer", customerNames);
};
