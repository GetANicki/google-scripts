import { getCustomerById } from "../services/customers";
import { formatAsCurrency } from "../shared/googleExt";
import { RowEditor } from "../shared/RowEditor";
import { OrderEntryColumn, OrderStatus, OrderStatuses } from "../shared/types";
import { onelineAddress } from "../shared/util";

const LockedColumns: OrderEntryColumn[] = [
  "Created",
  "Created By",
  "Customer",
  "Customer ID",
  "Nicki Gross",
  "Nicki ID",
  "Nicki Net",
  "Order ID",
  "Service",
  "Service ID",
  "Service Price",
  "Surcharge",
];

export function onFormSubmit({
  namedValues,
  range,
}: Omit<GoogleAppsScript.Events.SheetsOnFormSubmit, "namedValues"> & {
  namedValues: Record<OrderEntryColumn, string>;
}) {
  console.log("Processing form submission for row ", range.getRowIndex());
  const editor = new RowEditor<OrderEntryColumn>(range);

  editor.unlockCells();

  try {
    const timestamp = Date.now();

    if (!editor.get("Created")) {
      editor.set(
        "Created",
        new Date(timestamp)
          .toLocaleString("en-US", { hour12: false })
          .replace(",", ""),
      );

      editor.set("Created By", Session.getActiveUser().getEmail());

      editor.set("Status", "Draft" as OrderStatus);
    }

    // try to get the customer ID from the form values, if initial submission
    let customerId = extractId(namedValues["Customer"]);
    if (customerId) {
      editor.set("Customer ID", customerId);
      editor.set(
        "Customer",
        editor.get("Customer")?.replace(` (${customerId})`, ""),
      );
    }
    // otherwise get from the form
    else {
      customerId = editor.get("Customer ID");

      if (!customerId) {
        throw "Expected Customer ID but none existed - ABORTING";
      }
    }

    const serviceId = extractId(namedValues["Service"]);
    if (serviceId) {
      editor.set("Service ID", serviceId);
      editor.set(
        "Service",
        editor.get("Service")?.replace(` (${serviceId})`, ""),
      );
    }

    const nickiId = extractId(namedValues["Nicki"]);
    if (nickiId) {
      editor.set("Nicki ID", nickiId);
    }

    // Set status filter
    const statusValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList([...OrderStatuses])
      .build();
    editor.getCell("Status").setDataValidation(statusValidation);

    // populate customer info
    populateCustomerInfo(editor);

    // set formulas in calculated fields
    const transactionCell = editor.getCell("Transaction");
    const surchargeCell = editor.getCell("Surcharge");
    const servicePriceCell = editor.getCell("Service Price");
    const nickiGrossCell = editor.getCell("Nicki Gross");
    const nickiNetCell = editor.getCell("Nicki Net");

    formatAsCurrency(
      transactionCell,
      surchargeCell,
      servicePriceCell,
      nickiGrossCell,
      nickiNetCell,
    );

    nickiGrossCell.setFormula(
      `=${transactionCell.getA1Notation()} + ${surchargeCell.getA1Notation()} + ${servicePriceCell.getA1Notation()}`,
    );

    nickiNetCell.setFormula(
      `=${nickiGrossCell.getA1Notation()} - ${transactionCell.getA1Notation()}`,
    );
  } finally {
  }

  editor.lockCells(LockedColumns);
}

function populateCustomerInfo(editor: RowEditor<OrderEntryColumn>) {
  const customerId = editor.get("Customer ID");

  console.log(`Getting info for customer ${customerId}...`);
  const customer = getCustomerById(customerId);

  if (!customer) {
    console.log(`Unable to find customer ${customerId} - ABORTING`);
    return;
  }

  if (customer.phone) {
    editor.set("Drop-off Phone Number", customer.phone);
  }

  // Replace "Home" address with actual address
  const address = onelineAddress(customer.address);
  if (address) {
    console.log(`Customer ${customerId} has address on file`);

    if (editor.get("Pickup Location").toLocaleLowerCase().trim() === "home") {
      editor.set("Pickup Location", address);
    }
    if (editor.get("Drop-off Location").toLocaleLowerCase().trim() === "home") {
      editor.set("Drop-off Location", address);
    }
  } else {
    console.log(
      `Customer ${customerId} does not have an address on file - skipping address population`,
    );
  }
}

// extracts an id from a name in "<Name> (<Id>)" format
const extractId = (x: string): string | null =>
  /.+\((.*?)\)/gi.exec(x)?.[1] || null;
