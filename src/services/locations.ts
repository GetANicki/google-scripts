import { Address } from "cluster";
import config from "../shared/config";
import { readSpreadsheet } from "../shared/googleExt";
import { RowEditor } from "../shared/RowEditor";
import { Customer, Location } from "../shared/types";
import { onelineAddress } from "../shared/util";
import { getCustomerById } from "./customers";

export const HomeLocationName = "Home";
export const NewLocationName = "** New Location **";
export const HomeLocationNoSuffix = "HOME";

const LocationColumns = [
  "Location No",
  "Location Name",
  "Address",
  "Latitude",
  "Longitude",
] as const;

type LocationColumn = typeof LocationColumns[number];

export const getLocation = (
  addressOrLocationName: string,
  customerOrcustomerId?: string | Customer,
): Location | null => {
  if (addressOrLocationName === NewLocationName) return null;

  // resolve customer home address
  if (
    addressOrLocationName.toLowerCase().trim() ===
    HomeLocationName.toLowerCase().trim()
  ) {
    if (!customerOrcustomerId)
      throw Error("Unable to get home address without customer or customer ID");

    let customer: Customer | null = null;

    if (typeof customerOrcustomerId === "string") {
      customer = getCustomerById(customerOrcustomerId);
    } else {
      customer = customerOrcustomerId;
    }

    if (!customer?.address?.line1) {
      throw Error(`Customer ID ${customer?.id} does not have a home address`);
    }

    return {
      address: onelineAddress(customer.address)!,
      locationName: customer.name,
      locationNo: `${customer?.id.replace(
        /$cus_/,
        "",
      )}_${HomeLocationNoSuffix}`,
    };
  }

  const location = queryLocation(
    (x) =>
      x.locationName?.trim() === addressOrLocationName.trim() ||
      x.address === addressOrLocationName.trim(),
  );

  if (location) {
    console.log(`Found location matching ${addressOrLocationName}`);
    return location;
  }

  console.log(`Unable to find location matching ${addressOrLocationName}`);
  return { address: addressOrLocationName };
};

export const queryLocation = (predicate: (location: Location) => boolean) =>
  getLocations().find(predicate);

export const getLocations = (
  sheet?: GoogleAppsScript.Spreadsheet.Sheet,
): Location[] => readSpreadsheet<Location>(sheet || getLocationsSheet());

const getLocationsSheet = (): GoogleAppsScript.Spreadsheet.Sheet =>
  SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl).getSheetByName(
    config.LocationsSheetName,
  )!;

export const saveLocation = (location: Location): void => {
  if (!location) throw Error("[saveLocation] failed: invalid location");
  if (!location.address) throw Error("[saveLocation] failed: missing address");

  if (!location.locationName) {
    location.locationName = location.address;
  }

  if (!location.locationNo) {
    location.locationNo = parseLocationNo(location.address);
  }

  const sheet = getLocationsSheet();

  const rowId = RowEditor.findRowByColumn(
    sheet,
    1,
    location.locationNo?.trim()!,
    3,
  );

  let editor = rowId ? new RowEditor<LocationColumn>(sheet, rowId) : null;

  if (!editor) {
    editor = new RowEditor<LocationColumn>(
      sheet,
      sheet.appendRow([location.locationNo]).getLastRow(),
    );
    console.log("Adding new location...");
  } else {
    console.log("Updating existing location...");
  }

  editor.set("Location No", location.locationNo);
  editor.set("Location Name", location.locationName);
  editor.set("Address", location.address);
  if (location.latitude) editor.set("Latitude", location.latitude);
  if (location.longitude) editor.set("Longitude", location.longitude);
};

export const sort = () => getLocationsSheet().getRange("A3:G").sort(2);

/**
 * @access package
 */
export const parseLocationNo = (address: string | Address) => {
  if (typeof address === "string") {
    const matches = /^([0-9]+ [^,]+), ([^ ,]+), ([^, ]+),? ([0-9-]+)/.exec(
      address,
    );

    // didn't match the regex -- ah well, just crunch the whole thing together, excluding spaces and special characters
    if (!matches) return address.replace(OnlyAlphaNumericRegex, "");

    const [_, streetAddress, city, state, zip] = matches;

    return `${zip}_${streetAddress.replace(OnlyAlphaNumericRegex, "")}`;
  }
};

const OnlyAlphaNumericRegex = /[^a-z0-9]/gi;
