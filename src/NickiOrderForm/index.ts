import { DriverSpreadsheetUrl } from "../shared/secrets";
import { getProducts, getSubscriptions, getCustomers } from "../shared/stripe";

export function onFormSubmit() {
  // TODO
}

/** to be run as a timed service to pick up any (infrequent) changes */
export function syncExternalData() {
  const form = FormApp.getActiveForm();
  const ss = SpreadsheetApp.openByUrl(DriverSpreadsheetUrl);

  const products = getProducts();
  const subscriptions = getSubscriptions();
  const customers = getCustomers(products, subscriptions);
  const driverNames = getDriverNames(ss);

  updateCustomerField(form, customers);
  updateDriverField(form, driverNames);
  updateServiceField(form, products);
}

const updateCustomerField = (form, customers) => {
  const customerNames = [...new Set(customers.map((x) => x.displayName))];
  updateListField(form, "Customer", customerNames);
};

const updateDriverField = (form, driverNames) => {
  updateListField(form, "Nicki", driverNames);
};

const updateServiceField = (form, products) => {
  const services = products?.filter((x) => x.metadata?.type === "service");
  const serviceNames = services.map((x) => x.name);
  updateListField(form, "Service", serviceNames);
};

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @returns {string[]}
 */
const getDriverNames = (ss) => {
  const [headers, ...values] = ss
    .getSheetByName("Drivers")
    .getDataRange()
    .getDisplayValues();

  const firstNameColumn = headers.indexOf("First Name");
  const lastNameColumn = headers.indexOf("Last Name");

  return values
    .map(
      (d) =>
        `${d[firstNameColumn]} ${
          d[lastNameColumn] ? `${d[lastNameColumn].charAt(0)}.` : ""
        }`
    )
    .filter((e) => e?.trim().length)
    .sort();
};

/**
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 * @param {string[]} values the values to replace as the list values
 */
const updateListField = (form, title, values) => {
  const field = form
    .getItems()
    .filter((x) => x.getTitle() === title)
    .map((x) => x.asListItem())
    .find((x) => !!x);

  field.setChoiceValues(values);

  console.log(`Updated field ${title}:\r\n\t`, values.join("\r\n\t"));
};
