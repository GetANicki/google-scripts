import { RowEditor } from "../shared/RowEditor";
import { OrderEntryColumn } from "../shared/types";
import { orderStatusHandler } from "./editHandlers/orderStatusHandler";

const handlers = [orderStatusHandler];

export function onEdit(evt: GoogleAppsScript.Events.SheetsOnEdit) {
  const editor = new RowEditor<OrderEntryColumn>(
    evt.range.getSheet(),
    evt.range.getRowIndex(),
  );
  const columnName = editor.getColumnName(evt.range);
  const sheetName = evt.range.getSheet().getName();
  const columnIndex = evt.range.getColumn();

  console.log(
    `onEdit: ${sheetName}!${columnIndex}:${evt.range.getRowIndex()} (${columnName}) New Value: ${
      evt.value
    }, Old Value: ${evt.oldValue}`,
  );

  console.log("Date: ", editor.get("Pickup Date"));
  const date = editor.get<Date>("Pickup Date");
  console.log(
    `Day: ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  );

  handlers.forEach((handler) => handler(evt));
}
