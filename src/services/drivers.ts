import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { Driver } from "../shared/types";

export const getDrivers = (): Driver[] => {
  return readSpreadsheet<Driver>(
    SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl).getSheetByName(
      config.NickiDriversSheetName,
    )!,
  );
};
