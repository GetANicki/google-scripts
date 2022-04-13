import {
  CustomerEditor,
  getCustomersWithProduct,
} from "../../services/customers";
import { logError, logMessage } from "../../shared/audit";
import {
  Customer,
  OrderEntryColumn,
  Product,
  SheetCustomer,
  SheetCustomerColumn,
} from "../../shared/types";
import { onelineAddress, trim } from "../../shared/util";

export const syncCustomersFromStripe = () => {
  logMessage("Syncing customers from Stripe...");

  const sheet = CustomerEditor.getCustomersSheet();
  const stripeCustomers = getCustomersWithProduct();
  const sheetCustomers = CustomerEditor.getAll(sheet);
  const totalStripeCustomers = stripeCustomers?.length;

  console.log(`Found ${totalStripeCustomers} Stripe customers...`);

  const diff = getDiffs(sheetCustomers, stripeCustomers);

  let syncCount = 0;

  for (const addition of diff.additions) {
    console.log(`Adding customer ${addition?.["Customer ID"]}...`);

    try {
      addCustomer(addition, sheet);
      syncCount += 1;
    } catch (ex) {
      logMessage(
        `Failed to add customer: ${JSON.stringify(addition)}`,
        JSON.stringify(ex),
      );
    }
  }

  for (const update of diff.updates) {
    if (!update) continue;

    console.log(
      `Updating customer ${update?.customerId} (row ${update?.row})...`,
    );

    try {
      applyDiff(update, sheet);
      syncCount += 1;
    } catch (ex) {
      logMessage(
        `Failed to update customer: ${JSON.stringify(update)}`,
        JSON.stringify(ex),
      );
    }
  }

  try {
    //deleteInactiveStripeCustomers(diff.removals);
  } catch (ex: any) {
    logError("Falied to delete inactive customers", ex);
  }

  CustomerEditor.sort();

  logMessage(`Synced ${syncCount} of ${totalStripeCustomers} Stripe customers`);

  return stripeCustomers;
};

export const parseName = (name: string) => {
  const parts = name?.split(" ");

  if (!parts?.length) return null;

  const [firstName, ...lastNameParts] = parts;

  return { firstName, lastName: lastNameParts.join(" ") };
};

export const getDiffs = (
  sheetCustomers: SheetCustomer[],
  stripeCustomersWithProduct: [Customer, Product | null][],
) => {
  const stripeCustomers = stripeCustomersWithProduct.map(
    ([cus, prod]) =>
      ({
        address: onelineAddress(cus.address),
        customerId: cus.id,
        displayName: cus.name,
        ...parseName(cus.name),
        email: cus.email,
        phone: cus.phone,
        plan: prod?.name,
      } as SheetCustomer),
  );
  const existingIds = sheetCustomers.map((x) => x.customerId);
  const stripeIds = stripeCustomers.map((x) => x.customerId);

  const additions = stripeCustomers.filter(
    (x) => !existingIds.includes(x.customerId),
  );

  const removals = existingIds.filter((x) => !stripeIds.includes(x));

  const updates = sheetCustomers
    .flatMap((x) =>
      getDiff(
        x,
        stripeCustomers.find((y) => x.customerId === y.customerId),
      ),
    )
    .filter((x) => !!x);

  return { additions, removals, updates };
};

interface CustomerDiff {
  customerId: string;
  row: number;
  column: SheetCustomerColumn;
  oldValue: any;
  newValue: any;
}

export function getDiff(
  sheetCustomer: SheetCustomer,
  stripeCustomer: SheetCustomer | undefined,
) {
  if (!sheetCustomer || !stripeCustomer) return null;

  return (Object.getOwnPropertyNames(sheetCustomer) as (keyof SheetCustomer)[])
    .filter((x) => x !== "__row")
    .map(
      (prop) =>
        ({
          customerId: sheetCustomer.customerId,
          row: sheetCustomer.__row!,
          column: getColumn(prop),
          oldValue: trim(sheetCustomer[prop]) || "",
          newValue: trim(stripeCustomer[prop]) || "",
        } as CustomerDiff),
    )
    .filter((x) => x.newValue != x.oldValue);
}

const getColumn = (prop: keyof SheetCustomer): SheetCustomerColumn => {
  switch (prop) {
    case "address":
      return "Address";
    case "customerId":
      return "Customer ID";
    case "displayName":
      return "Display Name";
    case "email":
      return "Email";
    case "firstName":
      return "First Name";
    case "lastName":
      return "Last Name";
    case "phone":
      return "Phone";
    case "plan":
      return "Plan";

    default:
      throw Error(`Invalid column: ${prop}`);
  }
};

const addCustomer = (
  customer: SheetCustomer,
  sheet: GoogleAppsScript.Spreadsheet.Sheet | undefined,
) => {
  CustomerEditor.add(
    (Object.getOwnPropertyNames(customer) as (keyof SheetCustomer)[]).reduce(
      (cus, prop) => ({ ...cus, [getColumn(prop)]: customer[prop] }),
      {} as Record<SheetCustomerColumn, any>,
    ),
    sheet,
  );
};

const applyDiff = (
  { row, column, newValue }: CustomerDiff,
  sheet: GoogleAppsScript.Spreadsheet.Sheet | undefined,
) => {
  const editor = new CustomerEditor(row, sheet);
  editor.set(column, newValue);
};

function deleteInactiveStripeCustomers(stripeCustomerIds: string[]) {
  const toDelete = CustomerEditor.getCustomerIds().filter(
    (x) => !stripeCustomerIds.includes(x),
  );

  for (const id of toDelete) {
    CustomerEditor.removeById(id);
  }
}
