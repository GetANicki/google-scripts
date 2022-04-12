import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { Driver } from "../shared/types";
import { trim } from "../shared/util";

export const UnassignedDriverId = "unassigned";

export const getDrivers = (): Driver[] => {
  return readSpreadsheet<Driver>(
    SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl).getSheetByName(
      config.NickiDriversSheetName,
    )!,
  );
};

export const findDriverById = (driverId: string): Driver | null =>
  getDrivers().find((x) => trim(x.driverId) === trim(driverId)) || null;

export const findDriverByName = (name: string): Driver | null =>
  getDrivers().find((x) => trim(x.displayName) === trim(name)) || null;
