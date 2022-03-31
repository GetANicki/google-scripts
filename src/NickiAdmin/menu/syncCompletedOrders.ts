import {
  CompletedOrderDetails,
  getCompletedOrderDetails,
  OptimoRouteFile,
} from "../../services/optimoroute";
import { getOrderEditor, getOrders } from "../../services/orders";
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
    // get both the pickup and delivery orders
    ordersToSync.flatMap((x) => [x.orderId, `${x.orderId}_D`]),
  );

  console.log(
    `Found ${completedOrders.length} completed orders: ${JSON.stringify(
      completedOrders.map((x) => x.orderNo).join(", "),
    )}`,
  );

  for (const detail of completedOrders) {
    const orderId = detail.orderNo.trim().replace(/_D$/, "");
    const order = ordersToSync.find((x) => x.orderId.trim() === orderId);

    if (order) {
      syncCompletedOrder(detail, order);
    } else {
      console.log(`Unable to find order ${orderId}`);
      return;
    }
  }
};

const syncCompletedOrder = (
  { orderNo, data }: CompletedOrderDetails,
  order: OrderFormEntry,
) => {
  const isDelivery = /_D$/.test(orderNo);
  const editor = getOrderEditor(order.row);

  if (isDelivery) {
    editor.set("Status", "Delivered" as OrderStatus);
    editor.set("Delivered UTC", data?.endTime?.utcTime || "");
  }
  // otherwise it's pickup
  else {
    editor.set("Picked Up UTC", data?.endTime?.utcTime || "");

    saveReceipts(editor, data?.form?.images || []);

    const deliveryNote = data?.form?.note;
    if (/\$?[0-9.,]*/.test(deliveryNote || "")) {
      editor.set("Transaction", deliveryNote);
    }
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
