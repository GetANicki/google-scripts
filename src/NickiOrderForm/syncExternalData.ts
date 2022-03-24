import { getCustomers } from "../services/customers";
import { getDrivers } from "../services/drivers";
import {
  getActivePlan,
  getProducts,
  getSubscriptions,
} from "../services/stripe";
import { updateListField } from "../shared/googleExt";
import { Customer, Driver, Product, Subscription } from "../shared/types";

export function onFormSubmit() {
  // TODO
}

/** to be run as a timed service to pick up any (infrequent) changes */
export function syncExternalData() {
  const form = FormApp.getActiveForm();

  const products = getProducts();
  const subscriptions = getSubscriptions();
  const customers = getCustomers();
  const drivers = getDrivers();

  updateCustomerField(form, customers, products, subscriptions);
  updateDriverField(form, drivers);
  updateServiceField(form, products);
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

const updateDriverField = (
  form: GoogleAppsScript.Forms.Form,
  drivers: Driver[],
) =>
  updateListField(
    form,
    "Nicki",
    drivers
      .map(
        // <firstName> <lastName initial>. (<driverId>)
        ({ driverId, firstName, lastName }) =>
          `${firstName} ${
            lastName ? `${lastName.charAt(0)}.` : ""
          } (${driverId})`,
      )
      .sort(),
  );

const updateServiceField = (
  form: GoogleAppsScript.Forms.Form,
  products: Product[],
) => {
  const serviceNames = products
    ?.filter((x) => x.metadata?.type === "service")
    .map((x) => `${x.name} (${x.id})`);
  updateListField(form, "Service", serviceNames);
};
