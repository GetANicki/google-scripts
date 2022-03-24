import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { Driver } from "../shared/types";

export const getDrivers = (): Driver[] => {
  const ss = SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl);
  return readSpreadsheet<Driver>(ss, config.NickiDriversSheetName);
};
