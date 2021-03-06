import { saveFile } from "../../services/files";
import {
  OptimoCompletedOrderDetails,
  getCompletedOrderDetails,
  OptimoRouteFile,
} from "../../services/optimoroute";
import { getOrders, OrderEditor } from "../../services/orders";
import { logError, logMessage } from "../../shared/audit";
import { OrderFormEntry, OrderStatus } from "../../shared/types";
import { trim } from "../../shared/util";

const OrderStatusesToSync: OrderStatus[] = ["In Optimo", "Delivered"];

export const syncCompletedOrders = () => {
  const ordersToSync = getOrders().filter(
    (x) => !!x.orderId && OrderStatusesToSync.includes(x.status),
  );

  if (!ordersToSync.length) {
    logMessage("No orders found to sync");
    return;
  }

  const completedOrders = getCompletedOrderDetails(
    // get both the pickup and delivery orders
    ordersToSync.flatMap((x) => [x.orderId, `${x.orderId}_D`]),
  );

  logMessage(
    `Found ${completedOrders.length} completed orders: ${JSON.stringify(
      completedOrders.map((x) => x.orderNo).join(", "),
    )}`,
  );

  for (const detail of completedOrders) {
    const orderId = trim(detail.orderNo)?.replace(/_D$/, "");
    const order = ordersToSync.find((x) => trim(x.orderId) === orderId);

    if (order) {
      syncCompletedOrder(detail, order);
    } else {
      logMessage(`Unable to find order ${orderId}`);
      return;
    }
  }
};

const syncCompletedOrder = (
  { orderNo, data }: OptimoCompletedOrderDetails,
  order: OrderFormEntry,
) => {
  const isDelivery = /_D$/.test(orderNo);
  const editor = new OrderEditor(order.row);

  if (isDelivery) {
    editor.setIfDifferent("Status", "Delivered" as OrderStatus);
    editor.setIfDifferent("Delivered UTC", data?.endTime?.utcTime || "");
  }
  // otherwise it's pickup
  else {
    editor.setIfDifferent("Picked Up UTC", data?.endTime?.utcTime || "");

    saveReceipts(editor, data?.form?.images || []);

    const deliveryNote = data?.form?.note;
    if (/\$?[0-9.,]*/.test(deliveryNote || "")) {
      editor.setIfDifferent("Transaction", deliveryNote);
    }
  }
};

const saveReceipts = (
  editor: OrderEditor,
  receiptImages: OptimoRouteFile[],
) => {
  if (!receiptImages.length) {
    logMessage("No receipt images to save - skipping...");
    return;
  }

  const orderId = editor.get("Order ID");
  let folderUrl: string | null = null;
  let saveCount = 0;

  for (const receipt of receiptImages) {
    try {
      const image = UrlFetchApp.fetch(receipt.url, { method: "get" }).getBlob();
      console.log(`Downloaded ${receipt.url}`);
      const savedImage = saveFile(orderId, image);
      console.log(`Saved ${receipt.url} to ${savedImage.fileUrl}`);
      folderUrl = folderUrl || savedImage.folderUrl;
      saveCount += 1;
    } catch (ex: any) {
      logError(`Error saving ${receipt.url}`, ex);
    }
  }

  logMessage(
    `Saved ${saveCount} of ${receiptImages.length} images to ${folderUrl} for Order ID ${orderId}`,
  );

  if (folderUrl) {
    const linkText = "Receipt(s)";
    editor
      .getCell("Receipt")
      .setRichTextValue(
        SpreadsheetApp.newRichTextValue()
          .setText(linkText)
          .setLinkUrl(0, linkText.length, folderUrl)
          .build(),
      );
  } else {
    editor.getCell("Receipt").setValue("ERROR");
  }
};
