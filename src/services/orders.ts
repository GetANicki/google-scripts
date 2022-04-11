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
  OrderPriority,
  OrderStatus,
  OrderStatuses,
} from "../shared/types";
import { CustomerEditor } from "./customers";
import {
  findDriverById,
  findDriverByName,
  getDrivers,
  UnassignedDriverId,
} from "./drivers";
import { HomeLocationName, NewLocationName } from "./locations";

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
    this.set("Customer ID", customer?.get("Customer ID"));
    this.set("Membership", customer?.get("Plan"));

    this.set(
      "Drop-off Phone Number",
      customer?.get("Phone") ? `'${customer?.get("Phone")}` : "",
    );

    // "Home" isn't a valid location if the customer doesn't have an address
    if (!customer?.get("Address")) {
      if (this.get("Pickup Location") === HomeLocationName)
        this.set("Pickup Location", "");
      if (this.get("Drop-off Location") === HomeLocationName)
        this.set("Drop-off Location", "");
    }
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
    this.setColumnWidth("Status", 100);

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
    this.setColumnWidth("Priority", 75);

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

  static newRow(
    rowIndex: number = 0,
    values: Partial<Record<OrderEntryColumn, string | number | null>> = {},
  ) {
    if (!rowIndex) {
      rowIndex = OrderEditor.getOrdersSheet().getLastRow() + 1;
    }

    const editor = new OrderEditor(rowIndex);

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

    editor.assignCustomer(
      CustomerEditor.findCustomerByName(values["Customer"] as string),
    );

    // set driver (or unassigned if none was provided)
    editor.assignDriver(
      findDriverByName(values["Nicki"] as string) ||
        findDriverById(UnassignedDriverId),
    );

    // Default Priority
    editor.set(
      "Priority",
      editor.get("Priority") || ("Medium" as OrderPriority),
    );

    // copy the new locations if specified
    if (editor.get("Drop-off Location").trim() === NewLocationName) {
      editor.set("Drop-off Location", values["New Drop-off Location"]);
    }
    if (editor.get("Pickup Location").trim() === NewLocationName) {
      editor.set("Pickup Location", values["New Pickup Location"]);
    }

    // set default drop-off location to "Home"
    if (!editor.get("Drop-off Location")) {
      editor.set("Drop-off Location", HomeLocationName);
    }

    try {
      editor.formatCells();
    } catch (ex: any) {
      logError("Failed to format cells", ex);
    }

    return editor;
  }

  static getOrdersSheet = (
    sheet?: GoogleAppsScript.Spreadsheet.Sheet | undefined,
  ) => RowEditor.getSheet(config.OrdersSheetName, sheet);
}
