import { logMessage } from "../shared/audit";
import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { RowEditor } from "../shared/RowEditor";
import {
  Customer,
  SheetCustomerColumn,
  SheetCustomerColumns,
  Product,
  SheetCustomer,
} from "../shared/types";
import { trim } from "../shared/util";
import {
  get,
  getActivePlan,
  getAll,
  getProducts,
  getSubscriptions,
} from "./stripe";

const cache: Record<string, Customer> = {};

export const getCustomerById = (customerId: string): Customer | null => {
  if (cache[customerId]) return cache[customerId];

  const customer = get<Customer>(`/customers/${customerId}`);

  if (customer) {
    cache[customer.id] = customer;
    return customer;
  }

  return null;
};

export const getCustomersWithProduct = (): [Customer, Product | null][] => {
  const products = getProducts();
  const subscriptions = getSubscriptions();
  const customers = getCustomers();

  return customers.map(
    (x) =>
      [x, getActivePlan(x, products, subscriptions)] as [
        Customer,
        Product | null,
      ],
  );
};

export const getCustomers = (): Customer[] => {
  const custmers = getAll<Customer>("/customers", { limit: 100 });

  for (const c of custmers) {
    cache[c.id] = c;
  }

  return custmers;
};

export class CustomerEditor extends RowEditor<SheetCustomerColumn> {
  constructor(row: number, sheet?: GoogleAppsScript.Spreadsheet.Sheet) {
    super(CustomerEditor.getCustomersSheet(sheet), row);
  }

  remove = () => {
    const customerId = this.get("Customer ID");
    this.sheet.deleteRow(this.rowIndex);
    logMessage(`Removed Customer ${customerId}`);
  };

  static add = (
    entry: Record<SheetCustomerColumn, string | number | null | undefined>,
    sheetParam?: GoogleAppsScript.Spreadsheet.Sheet,
  ): CustomerEditor => {
    const sheet = CustomerEditor.getCustomersSheet(sheetParam);
    sheet.appendRow(
      SheetCustomerColumns.map((col) =>
        col === "Phone" && !!entry[col] ? `'${entry[col]}` : entry[col] || "",
      ),
    );
    return new CustomerEditor(sheet.getLastRow());
  };

  static findCustomerById = (
    id: string,
    sheet?: GoogleAppsScript.Spreadsheet.Sheet,
  ): CustomerEditor | null => {
    const rowIndex = RowEditor.findRowByColumn(
      CustomerEditor.getCustomersSheet(sheet),
      1,
      trim(id)!,
      2,
    );
    return rowIndex ? new CustomerEditor(rowIndex, sheet) : null;
  };

  static findCustomerByName = (
    name: string,
    sheet?: GoogleAppsScript.Spreadsheet.Sheet,
  ) => {
    const row = RowEditor.findRowByColumn<SheetCustomerColumn>(
      CustomerEditor.getCustomersSheet(sheet),
      2,
      trim(name),
      2,
    );
    console.log(`[findCustomerByName](${name}) => ${row}`);
    return row ? new CustomerEditor(row, sheet) : null;
  };

  static getAll = (sheet?: GoogleAppsScript.Spreadsheet.Sheet) =>
    readSpreadsheet<SheetCustomer>(
      CustomerEditor.getCustomersSheet(sheet),
    ).filter((x) => !!x.customerId);

  static getCustomerIds = (sheet?: GoogleAppsScript.Spreadsheet.Sheet) =>
    CustomerEditor.getCustomersSheet(sheet)
      .getRange("A2:A")
      .getDisplayValues()
      .map(([x]) => x)
      .filter((x) => !!x);

  static getCustomerNames = (sheet?: GoogleAppsScript.Spreadsheet.Sheet) =>
    CustomerEditor.getCustomersSheet(sheet)
      .getRange("B2:B")
      .getDisplayValues()
      .map(([x]) => trim(x))
      .filter((x) => !!x);

  static getCustomersSheet = (
    sheet?: GoogleAppsScript.Spreadsheet.Sheet,
  ): GoogleAppsScript.Spreadsheet.Sheet =>
    RowEditor.getSheet(config.CustomersSheetName, sheet);

  static removeById = (id: string) =>
    CustomerEditor.findCustomerById(id)?.remove();

  static sort = () =>
    CustomerEditor.getCustomersSheet().getRange("A2:G").sort(2);
}
