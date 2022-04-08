import config from "../shared/config";
import { logError, logMessage } from "../shared/audit";
import { RowEditor } from "../shared/RowEditor";
import { orderStatusHandler } from "./editHandlers/orderStatusHandler";
import { driverAssignmentHandler } from "./editHandlers/driverAssignmentHandler";

const handlers = [orderStatusHandler, driverAssignmentHandler];

export function onEdit(evt: GoogleAppsScript.Events.SheetsOnEdit) {
  const sheetName = evt.range.getSheet().getName();

  // Don't infinite loop!
  if (sheetName === config.AuditSheetName) return;

  const editor = new RowEditor<any>(
    evt.range.getSheet(),
    evt.range.getRowIndex(),
  );
  const columnName = editor.getColumnName(evt.range);
  const columnIndex = evt.range.getColumn();

  if (sheetName === config.OrdersSheetName) {
    const customerId = editor.get("Customer ID");
    const orderId = editor.get("Order ID");
    logMessage(
      `onEdit: ${customerId}:${orderId} (${columnName}) New Value: ${evt.value}, Old Value: ${evt.oldValue}`,
    );
  } else {
    logMessage(
      `onEdit: ${sheetName}!${columnIndex}:${evt.range.getRowIndex()} (${columnName}) New Value: ${
        evt.value
      }, Old Value: ${evt.oldValue}`,
    );
  }

  handlers.forEach((handler) => {
    try {
      handler(evt);
    } catch (ex: any) {
      logError(`onEdit Failed`, ex);
    }
  });
}
