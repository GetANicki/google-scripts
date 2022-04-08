import {
  getLocations,
  HomeLocationName,
  NewLocationName,
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
  const locationNames = [
    NewLocationName,
    HomeLocationName,
    ...locations.map((x) => x.locationName as string).filter((x) => !!x),
  ];

  updateListField<OrderEntryColumn>(form, "Pickup Location", locationNames);
  updateListField<OrderEntryColumn>(form, "Drop-off Location", locationNames);
};
