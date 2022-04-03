import { getCustomers } from "./customers";
import { getActivePlan, getProducts, getSubscriptions } from "./stripe";
import { updateListField } from "../shared/googleExt";
import {
  Customer,
  Location,
  OrderEntryColumn,
  Product,
  Subscription,
} from "../shared/types";
import {
  getLocations,
  HomeLocationName,
  OtherLocationName as NewLocationName,
} from "./locations";

export function syncExternalFormData(form: GoogleAppsScript.Forms.Form) {
  const products = getProducts();
  const subscriptions = getSubscriptions();
  const customers = getCustomers();
  const locations = getLocations();

  updateCustomerField(form, customers, products, subscriptions);
  updateLocationsField(form, locations);
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
  updateListField<OrderEntryColumn>(form, "Customer", customerNames);
};

const updateLocationsField = (
  form: GoogleAppsScript.Forms.Form,
  locations: Location[],
) => {
  const locationNames = [
    NewLocationName,
    HomeLocationName,
    ...locations.map((x) => x.locationName as string).filter((x) => !!x),
  ];

  updateListField<OrderEntryColumn>(form, "Pickup Location", locationNames);
  updateListField<OrderEntryColumn>(form, "Drop-off Location", locationNames);
};
