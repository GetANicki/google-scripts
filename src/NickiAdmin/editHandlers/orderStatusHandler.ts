import { getLocation } from "../../services/locations";
import { upsertOrder } from "../../services/optimoroute";
import config from "../../shared/config";
import { RowEditor } from "../../shared/RowEditor";
import { OrderEntryColumn, OrderStatus } from "../../shared/types";

export function orderStatusHandler(evt: GoogleAppsScript.Events.SheetsOnEdit) {
  const editor = new RowEditor<OrderEntryColumn>(
    evt.range.getSheet(),
    evt.range.getRowIndex(),
  );

  if (
    evt.range.getSheet().getName() !== config.OrdersSheetName ||
    editor.getColumnName(evt.range) !== "Status"
  ) {
    return;
  }

  const status = evt.value as OrderStatus;

  switch (status) {
    case "Confirmed":
      scheduleOrder(editor);
      break;
  }
}

const scheduleOrder = (editor: RowEditor<OrderEntryColumn>) => {
  const orderId =
    editor.get("Order ID") ||
    `${editor.get("Customer ID").replace(/^cus_/, "")}_${Date.now()}`;

  const date = editor.get<Date>("Pickup Date");

  const pickupLocation = getLocation(
    editor.get("Pickup Location"),
    editor.get("Customer ID"),
  );
  const dropoffLocation = getLocation(
    editor.get("Drop-off Location"),
    editor.get("Customer ID"),
  );

  if (!pickupLocation)
    throw Error(
      "Invalid pickup location - please replace with valid location or address",
    );
  else console.log(`Pickup location: ${JSON.stringify(pickupLocation)}`);
  if (!dropoffLocation)
    throw Error(
      "Invalid drop-off location - please replace with valid location or address",
    );
  else console.log(`Drop-off location: ${JSON.stringify(dropoffLocation)}`);

  upsertOrder(
    orderId,
    {
      date,
      location: pickupLocation,
      duration: editor.get("Pickup Duration"),
      notes: editor.get("Pickup Comments"),
      link: editor.get("Pickup Link"),
      customerName: editor.get("Customer"),
      attachment: editor.get("Attachment"),
    },
    {
      date,
      location: dropoffLocation,
      duration: editor.get("Drop-off Duration"),
      notes: editor.get("Drop-off Comments"),
      phone: editor.get("Drop-off Phone Number"),
      customerName: editor.get("Customer"),
    },
  );

  editor.set("Order ID", orderId);
  editor.set("Status", "Scheduled" as OrderStatus);
};
