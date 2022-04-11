import {
  CustomerEditor,
  getCustomersWithProduct,
} from "../../services/customers";
import { logError, logMessage } from "../../shared/audit";
import { Customer, Product } from "../../shared/types";
import { onelineAddress } from "../../shared/util";

export const syncCustomersFromStripe = () => {
  logMessage("Syncing customers from Stripe...");

  const stripeCustomers = getCustomersWithProduct();
  const totalStripeCustomers = stripeCustomers?.length;

  console.log(`Found ${totalStripeCustomers} Stripe customers...`);

  let syncCount = 0;

  for (const customer of stripeCustomers) {
    if (!customer || !customer[0]) continue;

    const customerId = customer[0].id;

    console.log(`Syncing Stripe customer ${customerId}...`);

    try {
      syncCustomer(customer);
      syncCount += 1;
    } catch (ex) {
      logMessage(
        `Failed to sync stripe customer ${customerId}`,
        JSON.stringify(ex),
      );
    }
  }

  try {
    deleteInactiveStripeCustomers(stripeCustomers.map(([x]) => x.id));
  } catch (ex: any) {
    logError("Falied to delete inactive customers", ex);
  }

  CustomerEditor.sort();

  logMessage(`Synced ${syncCount} of ${totalStripeCustomers} Stripe customers`);

  return stripeCustomers;
};

const syncCustomer = ([stripeCustomer, product]: [
  Customer,
  Product | null,
]) => {
  const existing = CustomerEditor.findCustomerById(stripeCustomer.id);

  if (existing) {
    existing.setIfDifferent("Display Name", stripeCustomer.name);
    existing.setIfDifferent("Email", stripeCustomer.email);
    existing.setIfDifferent("Phone", stripeCustomer.phone);
    existing.setIfDifferent("Address", onelineAddress(stripeCustomer.address));
    console.log(
      `Updated existing customer ${stripeCustomer.name} (${stripeCustomer.id})`,
    );
    return;
  }

  CustomerEditor.add({
    "Customer ID": stripeCustomer.id,
    "Display Name": stripeCustomer.name,
    Email: stripeCustomer.email,
    Phone: stripeCustomer.phone ? `'${stripeCustomer.phone}` : "",
    "First Name": stripeCustomer.name?.split(" ")?.[0],
    "Last Name": stripeCustomer.name?.split(" ")?.[1],
    Address: onelineAddress(stripeCustomer.address),
    Plan: product?.name,
  });

  console.log(`Added customer ${stripeCustomer.id}`);
};

function deleteInactiveStripeCustomers(stripeCustomerIds: string[]) {
  const customerIds = CustomerEditor.getCustomerIds().filter((x) =>
    x.startsWith("cus_"),
  );

  const toDelete = customerIds.filter((x) => !stripeCustomerIds.includes(x));

  for (const id of toDelete) {
    CustomerEditor.removeById(id);
  }
}
