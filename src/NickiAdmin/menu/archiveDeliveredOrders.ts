import { getOrders, OrderEditor } from "../../services/orders";
import config from "../../shared/config";
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

  for (const order of ordersToArchive) {
    const newRow = archivedOrdersSheet.getRange(
      archivedOrdersSheet.getLastRow() + 1,
      1,
      1,
      1,
    );

    orderSheet.getRange(`${order.row}:${order.row}`).moveTo(newRow);

    console.log(
      `Archived order ${order.orderId} (customer ${order.customerId} - ${order.customer})`,
    );
  }

  deleteEmptyRows(orderSheet);

  return ordersToArchive.length;
};

function deleteEmptyRows(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const data = sheet?.getDataRange()?.getDisplayValues();

  const emptyRowNumbers = data
    .map((x, i) =>
      x
        .flatMap((x) => x)
        .map((x) => x.replace(",", "").trim())
        .filter(Boolean).length
        ? null
        : i + 1,
    )
    .filter(Boolean)
    .reverse() as number[];

  for (const row of emptyRowNumbers) {
    sheet.deleteRow(row);
    console.log(`Deleted empty order row ${row}`);
  }
}
