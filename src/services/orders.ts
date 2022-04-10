import { logError, logMessage } from "../shared/audit";
import config from "../shared/config";
import { formatAsCurrency, readSpreadsheet } from "../shared/googleExt";
import { RowEditor } from "../shared/RowEditor";
import {
  Driver,
  OrderDriver,
  OrderEntryColumn,
  OrderFormEntry,
  OrderPriorities,
  OrderStatus,
  OrderStatuses,
} from "../shared/types";
import { CustomerEditor } from "./customers";
import { getDrivers } from "./drivers";

export const getOrders = (): OrderFormEntry[] => {
  const sheet = OrderEditor.getOrdersSheet();
  const records = readSpreadsheet<Record<keyof OrderFormEntry, string>>(sheet);

  return records.map((record, idx) => ({
    // copy all the string properties
    ...record,
    row: idx + 2, // 1-based index, not 0-base; plus 1 more to skip header row
    // and parse all the non-string properties
    status: OrderStatuses.includes(record.status as OrderStatus)
      ? (record.status as OrderStatus)
      : "Draft",
    pickupDate: record.pickupDate ? new Date(record.pickupDate) : null,
    timestamp: new Date(record.timestamp),
  }));
};

export const assignDriversToOrders = (orderDrivers: OrderDriver[]) => {
  const orders = getOrders().filter((x) => x.status !== "Paid");
  const drivers = getDrivers();

  const driverNames = drivers.reduce(
    (agg, { driverId, firstName, lastName }) => ({
      ...agg,
      [driverId]: `${firstName} ${lastName}`,
    }),
    {} as Record<string, string>,
  );

  console.log(
    `Driver Assignments:\r\n${JSON.stringify(orderDrivers, null, 2)}`,
  );
  console.log(
    `Orders:\r\n${JSON.stringify(
      orders.map((x) => x.orderId),
      null,
      2,
    )}`,
  );

  orderDrivers.forEach(({ orderNo, driverSerial }) => {
    const order = orders.find((x) => x.orderId.trim() === orderNo.trim());
    const driverName = driverNames[driverSerial]?.trim();

    if (order) {
      const editor = new OrderEditor(order.row);

      if (editor.get("Nicki ID")?.trim() !== driverSerial.trim()) {
        editor.set("Nicki ID", driverSerial);
        editor.set("Nicki", driverName);
        logMessage(
          `Updated Order ${orderNo} to Nicki ${driverName} (${driverSerial})`,
        );
      }
    } else {
      logError(`Unable to find order ${orderNo}`);
    }
  });
};

export class OrderEditor extends RowEditor<OrderEntryColumn> {
  constructor(rowIndex: number, sheet?: GoogleAppsScript.Spreadsheet.Sheet) {
    super(OrderEditor.getOrdersSheet(sheet), rowIndex);
    if (rowIndex === 1) throw Error("Unable to modify header row");
  }

  assignCustomer = (customer: CustomerEditor | null) => {
    this.setIfDifferent("Customer ID", customer?.get("Customer ID"));
  };

  assignDriver = (driver: Driver | null) => {
    this.setIfDifferent("Nicki ID", driver?.driverId);
    this.setIfDifferent("Nicki", driver?.displayName);
  };

  formatCells = () => {
    // Set status filter
    const statusValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList([...OrderStatuses])
      .build();
    this.getCell("Status").setDataValidation(statusValidation);

    // Set location filters
    const locationValidation = SpreadsheetApp.newDataValidation()
      .requireValueInRange(
        this.sheet.getRange(`'${config.LocationsSheetName}'!$B$2:$B`),
      )
      .build();
    this.getCell("Pickup Location").setDataValidation(locationValidation);
    this.getCell("Drop-off Location").setDataValidation(locationValidation);

    // Set Customer filter
    this.getCell("Customer").setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInRange(
          this.sheet.getRange(`'${config.CustomersSheetName}'!$B$2:$B`),
        )
        .build(),
    );

    // Set Nicki filter
    this.getCell("Nicki").setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInRange(
          this.sheet.getRange(`'${config.NickiDriversSheetName}'!$B$2:$B`),
        )
        .build(),
    );

    // Set status filter
    const priorityValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList([...OrderPriorities])
      .build();
    this.getCell("Priority").setDataValidation(priorityValidation);
    this.setColumnWidth("Priority", 70);

    // set formulas in calculated fields
    const transactionCell = this.getCell("Transaction");
    const surchargeCell = this.getCell("Surcharge");
    const servicePriceCell = this.getCell("Service Price");
    const nickiGrossCell = this.getCell("Nicki Gross");
    const nickiNetCell = this.getCell("Nicki Net");

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
  };

  static getOrdersSheet = (
    sheet?: GoogleAppsScript.Spreadsheet.Sheet | undefined,
  ) => RowEditor.getSheet(config.OrdersSheetName, sheet);
}
