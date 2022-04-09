import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { Driver } from "../shared/types";

export const UnassignedDriverId = "unassigned";

export const getDrivers = (): Driver[] => {
  return readSpreadsheet<Driver>(
    SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl).getSheetByName(
      config.NickiDriversSheetName,
    )!,
  );
};

export const findDriverById = (driverId: string): Driver | null =>
  getDrivers().find((x) => x.driverId?.trim() === driverId) || null;

export const findDriverByName = (name: string): Driver | null =>
  getDrivers().find((x) => x.displayName?.trim() === name) || null;
