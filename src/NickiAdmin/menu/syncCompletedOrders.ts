import {
  CompletedOrderDetails,
  getCompletedOrderDetails,
  OptimoRouteFile,
} from "../../services/optimoroute";
import { getOrderEditor, getOrders } from "../../services/orders";
import { RowEditor } from "../../shared/RowEditor";
import { OrderFormEntry, OrderStatus } from "../../shared/types";

const OrderStatusesToSync: OrderStatus[] = ["Scheduled", "Delivered"];

export const syncCompletedOrders = () => {
  const ordersToSync = getOrders().filter((x) =>
    OrderStatusesToSync.includes(x.status),
  );

  if (!ordersToSync.length) {
    console.log("No orders found to sync");
    return;
  }

  const completedOrders = getCompletedOrderDetails(
    ordersToSync.map((x) => x.orderId),
  );

  console.log(
    `Found ${completedOrders.length} completed orders: ${JSON.stringify(
      completedOrders.map((x) => x.orderNo).join(", "),
    )}`,
  );

  for (const detail of completedOrders) {
    const order = ordersToSync.find(
      (x) => x.orderId.trim() === detail.orderNo.trim(),
    );

    if (order) {
      syncCompletedOrder(detail, order);
    } else {
      console.log(`Unable to find order ${detail.orderNo}`);
      return;
    }
  }
};

const syncCompletedOrder = (
  { data }: CompletedOrderDetails,
  order: OrderFormEntry,
) => {
  const editor = getOrderEditor(order.row);

  editor.set("Status", "Delivered" as OrderStatus);
  editor.set("Delivered UTC", data?.endTime?.utcTime || "");

  saveReceipts(editor, data?.form?.images || []);

  const deliveryNote = data?.form?.note;
  if (/\$?[0-9.,]*/.test(deliveryNote || "")) {
    editor.set("Transaction", deliveryNote);
  }
};

const saveReceipts = (
  editor: ReturnType<typeof getOrderEditor>,
  receiptUrls: OptimoRouteFile[],
) => {
  // TODO: download to Google Drive and link to folder;
  //       until then just log that we're saving only the first one
  if (receiptUrls.length > 1) {
    console.log(
      `Found ${receiptUrls.length} receipt URLs - only getting first one`,
    );
  }

  if (receiptUrls.length) {
    const linkText = "Receipt";
    const link = SpreadsheetApp.newRichTextValue()
      .setText(linkText)
      .setLinkUrl(0, linkText.length, receiptUrls[0].url)
      .build();

    editor.getCell("Receipt").setRichTextValue(link);
  }
};
