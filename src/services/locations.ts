import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { Customer, Location } from "../shared/types";
import { onelineAddress } from "../shared/util";
import { getCustomerById } from "./customers";

export const HomeLocationName = "Home";
export const OtherLocationName = "New Location (enter below)";

const isAddress = (addressOrLocationName: string): boolean =>
  !!addressOrLocationName?.includes(" ");

export const isHomeAddress = (addressOrLocationName: string): boolean =>
  addressOrLocationName.toLowerCase().trim() === HomeLocationName.toLowerCase();

export const getLocation = (
  addressOrLocationName: string,
  customerOrcustomerId?: string | Customer,
): Location | null => {
  if (addressOrLocationName === OtherLocationName) return null;

  // resolve customer home address
  if (isHomeAddress(addressOrLocationName)) {
    if (!customerOrcustomerId)
      throw Error("Unable to get home address without customer or customer ID");

    let customer: Customer | null = null;

    if (typeof customerOrcustomerId === "string") {
      customer = getCustomerById(customerOrcustomerId);
    } else {
      customer = customerOrcustomerId;
    }

    if (!customer?.address?.line1) {
      console.log(
        `WARNING: Customer ID ${customer?.id} does not have a home address`,
      );

      return null;
    }

    return {
      address: onelineAddress(customer.address)!,
      locationName: customer.displayName || customer.name,
      locationNo: `${customer?.id.replace(/$cus_/, "")}_Home`,
    };
  }

  // return regular address
  if (isAddress(addressOrLocationName)) {
    return getLocationByAddress(addressOrLocationName);
  }

  return getLocationByName(addressOrLocationName);
};

export const getLocationByAddress = (address: string): Location => {
  const location =
    getLocations().find((x) => x.address?.trim().startsWith(address?.trim())) ||
    null;

  return {
    address,
    ...location,
  };
};

export const getLocationByName = (name: string): Location | null =>
  getLocations().find((x) => x.locationName?.trim() === name?.trim()) || null;

export const getLocations = (): Location[] =>
  readSpreadsheet<Location>(
    SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl).getSheetByName(
      config.LocationsSheetName,
    )!,
  );
