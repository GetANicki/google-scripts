import { getCustomerById } from "../services/customers";
import { NewLocationName } from "../services/locations";
import { OrderEditor } from "../services/orders";
import { logError, logMessage } from "../shared/audit";
import { formatAsCurrency } from "../shared/googleExt";
import { OrderEntryColumn, OrderStatus, OrderStatuses } from "../shared/types";

export function onFormSubmit({
  namedValues,
  range,
}: Omit<GoogleAppsScript.Events.SheetsOnFormSubmit, "namedValues"> & {
  namedValues: Record<OrderEntryColumn, string>;
}) {
  console.log("Processing form submission for row " + range.getRowIndex());

  const editor = new OrderEditor(range.getRowIndex());

  const timestamp = Date.now();
  const timestampDate = new Date(timestamp);

  if (!editor.get("Created")) {
    editor.setDate("Created", timestampDate);
    editor.set("Status", "Draft" as OrderStatus);
  }

  const pickupDate = editor.get("Pickup Date");
  console.log("Pickup date", typeof pickupDate, pickupDate);
  // default date to today if not specified
  if (!pickupDate) {
    editor.setDate("Pickup Date", timestampDate);
    console.log("Pickup date not set - defaulting to today");
  }

  // try to get the customer ID from the form values, if initial submission
  let customerId = extractId(namedValues["Customer"]);
  if (customerId) {
    const membership = /\[(.*?)\]/.exec(namedValues["Customer"])?.[1];
    if (membership) {
      editor.set("Membership", membership.trim());
    }

    editor.set("Customer ID", customerId);
    editor.set(
      "Customer",
      editor
        .get("Customer")
        ?.replace(` (${customerId})`, "")
        ?.replace(` [${membership}]`, "")
        ?.trim(),
    );
  }
  // otherwise get from the form
  else {
    customerId = editor.get("Customer ID");

    if (!customerId) {
      throw "Expected Customer ID but none existed - ABORTING";
    }
  }

  // copy the new locations if specified
  if (editor.get("Drop-off Location").trim() === NewLocationName) {
    editor.set("Drop-off Location", namedValues["New Drop-off Location"]);
  }
  if (editor.get("Pickup Location").trim() === NewLocationName) {
    editor.set("Pickup Location", namedValues["New Pickup Location"]);
  }

  // populate customer info
  populateCustomerInfo(editor);

  try {
    editor.formatCells();
  } catch (ex: any) {
    logError("Failed to format cells", ex);
  }

  logMessage(
    `Processed form submission for Customer ${editor.get(
      "Customer",
    )}; row ${range.getRowIndex()}`,
  );
}

function populateCustomerInfo(editor: OrderEditor) {
  const customerId = editor.get("Customer ID");

  console.log(`Getting info for customer ${customerId}...`);
  const customer = getCustomerById(customerId);

  if (!customer) {
    logError(
      `Unable to find customer ${customerId} - not populating customer info`,
    );
    return;
  }

  if (customer.phone) {
    editor.set("Drop-off Phone Number", customer.phone);
  }
}

// extracts an id from a name in "<Name> (<Id>)" format
const extractId = (x: string): string | null =>
  /.+\((.*?)\)/gi.exec(x)?.[1] || null;
