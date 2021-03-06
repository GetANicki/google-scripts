import {
  getLocations,
  HomeLocationName,
  NewLocationName,
  sort as sortLocations,
} from "../../services/locations";
import { updateListField } from "../../shared/googleExt";
import { Location, OrderEntryColumn } from "../../shared/types";

export function syncLocationFormField(form: GoogleAppsScript.Forms.Form) {
  const locations = getLocations();
  updateLocationsField(form, locations);
}

const updateLocationsField = (
  form: GoogleAppsScript.Forms.Form,
  locations: Location[],
) => {
  sortLocations();

  const locationNames = [
    ...new Set([
      NewLocationName,
      HomeLocationName,
      ...locations.map((x) => x.locationName as string).filter((x) => !!x),
    ]),
  ];

  updateListField<OrderEntryColumn>(form, "Pickup Location", locationNames);
  updateListField<OrderEntryColumn>(form, "Drop-off Location", locationNames);
};
