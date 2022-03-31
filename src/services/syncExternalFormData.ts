import { getCustomers } from "./customers";
import { getActivePlan, getProducts, getSubscriptions } from "./stripe";
import { updateListField } from "../shared/googleExt";
import { Customer, Product, Subscription } from "../shared/types";

export function syncExternalFormData(form: GoogleAppsScript.Forms.Form) {
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
          [customer.name, plan ? `[${plan.name}]` : "", `(${customer.id})`]
            .filter((x) => !!x)
            .join(" "),
        )
        .filter((x) => !!x)
        .sort(),
    ),
  ];
  updateListField(form, "Customer", customerNames);
};
