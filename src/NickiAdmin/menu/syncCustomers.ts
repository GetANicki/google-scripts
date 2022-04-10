import { updateListField } from "../../shared/googleExt";
import { Customer, OrderEntryColumn, Product } from "../../shared/types";
import { syncCustomersFromStripe } from "./syncCustomersFromStripe";

export function syncCustomers(form: GoogleAppsScript.Forms.Form) {
  const customers = syncCustomersFromStripe();
  updateCustomerField(form, customers);
}

const updateCustomerField = (
  form: GoogleAppsScript.Forms.Form,
  customers: [Customer, Product | null][],
) => {
  const customerNames = [
    ...new Set(
      customers
        .map(([customer, product]) =>
          [
            customer.name,
            customer.address?.line1 ? "" : "<NO ADDR>",
            product ? `[${product.name}]` : "",
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
