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

  try {
    switch (status) {
      case "Confirmed":
        scheduleOrder(editor);
        break;
    }
  } catch (ex) {
    SpreadsheetApp.getUi().alert(`Error: ${JSON.stringify(ex)}`);
    throw ex;
  }
}

const scheduleOrder = (editor: RowEditor<OrderEntryColumn>) => {
  const orderId =
    editor.get("Order ID") ||
    `${editor.get("Customer ID").replace(/^cus_/, "")}_${Date.now()}`;

  const date = editor.get<Date>("Pickup Date");

  console.log("Attachment", JSON.stringify(editor.get("Attachment")));

  upsertOrder(
    orderId,
    {
      date,
      location: editor.get("Pickup Location"),
      duration: editor.get("Pickup Duration"),
      notes: editor.get("Pickup Comments"),
      link: editor.get("Pickup Link"),
      customerName: editor.get("Customer"),
      attachment: editor.get("Attachment"),
    },
    {
      date,
      location: editor.get("Drop-off Location"),
      duration: editor.get("Drop-off Duration"),
      notes: editor.get("Drop-off Comments"),
      phone: editor.get("Drop-off Phone Number"),
      customerName: editor.get("Customer"),
    },
  );

  editor.set("Order ID", orderId);
  editor.set("Status", "Scheduled" as OrderStatus);
};
