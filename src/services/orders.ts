import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { OrderFormEntry } from "../shared/types";

export const getOrders = (): OrderFormEntry[] => {
  const ss = SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl);
  return readSpreadsheet<Record<keyof OrderFormEntry, string>>(
    ss,
    config.OrdersSheetName,
  ).map((record) => ({
    // copy all the string properties
    ...record,
    // and parse all the non-string properties
    timestamp: new Date(record.timestamp),
  }));
};
