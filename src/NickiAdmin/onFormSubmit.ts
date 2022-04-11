import { getCustomerById } from "../services/customers";
import { UnassignedDriverId } from "../services/drivers";
import { NewLocationName } from "../services/locations";
import { OrderEditor } from "../services/orders";
import { logError, logMessage } from "../shared/audit";
import { formatAsCurrency } from "../shared/googleExt";
import {
  OrderEntryColumn,
  OrderPriority,
  OrderStatus,
  OrderStatuses,
} from "../shared/types";

export function onFormSubmit({
  namedValues,
  range,
}: Omit<GoogleAppsScript.Events.SheetsOnFormSubmit, "namedValues"> & {
  namedValues: Record<OrderEntryColumn, string>;
}) {
  const rowIndex = range.getRowIndex();

  console.log("Processing form submission for row " + rowIndex);

  const editor = OrderEditor.newRow(rowIndex, namedValues);

  logMessage(
    `Processed form submission for Customer ${editor.get(
      "Customer",
    )}; row ${rowIndex}`,
  );
}
