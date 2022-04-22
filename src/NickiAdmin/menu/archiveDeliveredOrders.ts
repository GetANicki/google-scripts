import { getOrders, OrderEditor } from "../../services/orders";
import { logError, logMessage } from "../../shared/audit";
import config from "../../shared/config";
import { deleteEmptyRows } from "../../shared/googleExt";
import { RowEditor } from "../../shared/RowEditor";
import { OrderStatus } from "../../shared/types";

const ArchiveStatuses: OrderStatus[] = ["Delivered", "Invoiced", "Paid"];

export const archiveDeliveredOrders = () => {
  const ordersToArchive = getOrders().filter((x) =>
    ArchiveStatuses.includes(x.status),
  );

  const orderSheet = OrderEditor.getOrdersSheet();
  const archivedOrdersSheet = RowEditor.getSheet(
    config.ArchivedOrdersSheetName,
  );

  validateHeaders(orderSheet, archivedOrdersSheet);

  for (const order of ordersToArchive) {
    const newRow = archivedOrdersSheet.getRange(
      archivedOrdersSheet.getLastRow() + 1,
      1,
      1,
      1,
    );

    orderSheet.getRange(`${order.row}:${order.row}`).moveTo(newRow);

    logMessage(
      `Archived order ${order.orderId} (customer ${order.customerId} - ${order.customer})`,
    );
  }

  deleteEmptyRows(orderSheet);

  return ordersToArchive.length;
};

const validateHeaders = (
  src1: GoogleAppsScript.Spreadsheet.Sheet,
  src2: GoogleAppsScript.Spreadsheet.Sheet,
) => {
  const src1Headers = RowEditor.getHeaders(src1);
  const src2Headers = RowEditor.getHeaders(src2);

  const results = src1Headers.filter(Boolean).map((x, i) => ({
    header: x,
    valid: i === src2Headers.indexOf(x),
  }));

  console.log(`Headers: ${JSON.stringify(results, null, 2)}`);

  const invalidHeaders = results.filter((x) => !x.valid).map((x) => x.header);

  console.log(`Invalid headers: ${invalidHeaders.join(", ")}`);

  if (invalidHeaders.length) {
    logError(
      `** Column Mismatch ** The following headers are out of place: ${invalidHeaders.join(
        ", ",
      )}`,
    );
  }
};
