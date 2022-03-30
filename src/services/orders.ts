import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { RowEditor } from "../shared/RowEditor";
import {
  OrderEntryColumn,
  OrderFormEntry,
  OrderStatus,
  OrderStatuses,
} from "../shared/types";
import { getDrivers } from "./drivers";

export interface OrderDriver {
  orderNo: string;
  driverSerial: string;
}

export const getOrders = (): OrderFormEntry[] => {
  const sheet = getOrdersSheet();
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
  const sheet = getOrdersSheet();
  const orders = getOrders();
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
  console.log(`Drivers:\r\n${JSON.stringify(driverNames, null, 2)}`);
  console.log(
    `Orders:\r\n${JSON.stringify(
      orders.map((x) => x.orderId),
      null,
      2,
    )}`,
  );

  orderDrivers.forEach(({ orderNo, driverSerial }) => {
    const order = orders.find((x) => x.orderId.trim() === orderNo.trim());

    if (order) {
      const editor = new RowEditor<OrderEntryColumn>(sheet, order.row);
      editor.set("Nicki ID", driverSerial);
      editor.set("Nicki", driverNames[driverSerial]);

      console.log(
        `Updated Order ${orderNo} to Nicki ${driverNames[driverSerial]} (${driverSerial})`,
      );
    } else {
      console.log(`Unable to find order ${orderNo}`);
    }
  });
};

export const getOrderEditor = (row: number) =>
  new RowEditor<OrderEntryColumn>(getOrdersSheet(), row);

const getOrdersSheet = () =>
  SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl)?.getSheetByName(
    config.OrdersSheetName,
  )!;
