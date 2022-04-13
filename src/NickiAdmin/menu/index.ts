import { logError, notify } from "../../shared/audit";
import config from "../../shared/config";
import { syncCompletedOrders } from "./syncCompletedOrders";
import { syncCustomerFormField } from "./syncCustomerFormField";
import { syncLocationFormField } from "./syncLocationFormField";
import { updateOrderDrivers } from "./updateOrderDrivers";
import { formatCurrentRow } from "./formatCurrentRow";
import { OrderEditor } from "../../services/orders";
import uploadImageHtml from "./uploadImage/upload.html";
import { syncCustomersFromStripe } from "./syncCustomersFromStripe";

// Not a menu item, but used by a menu item
export { uploadFile } from "./uploadImage/uploadFile";

export function menu_AddOrder() {
  try {
    const editor = OrderEditor.newRow();
    editor.setActive("Customer");
    notify(`Added new Order Row ${editor.rowIndex}`);
  } catch (error: any) {
    logError("menu_AddOrder", error);
  }
}

export function menu_UploadFile() {
  try {
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(uploadImageHtml),
      "Upload File",
    );
  } catch (error: any) {
    logError("menu_UploadFile", error);
  }
}

export function menu_FormatCurrentRow() {
  try {
    formatCurrentRow();
  } catch (error: any) {
    logError("menu_FormatCurrentRow", error);
  }
}

export function menu_SyncCompletedOrders() {
  try {
    syncCompletedOrders();
    notify("Updated Completed Orders");
  } catch (error: any) {
    logError("menu_SyncCompletedOrders", error);
  }
}

export function menu_UpdateDriverAssignments() {
  try {
    updateOrderDrivers();
    notify("Updated Order Drivers");
  } catch (error: any) {
    logError("menu_UpdateDriverAssignments", error);
  }
}

export function menu_SyncCustomersFromStripe() {
  try {
    syncCustomersFromStripe();
    notify("Synched customers from Stripe");
    menu_SyncCustomerFormField();
  } catch (error: any) {
    logError("menu_SyncCustomersFromStripe", error);
  }
}

export function menu_SyncCustomerFormField() {
  try {
    syncCustomerFormField(FormApp.openByUrl(config.OrderFormUrl));
    notify("Synched customer form field");
  } catch (error: any) {
    logError("menu_SyncCustomerFormField", error);
  }
}

export function menu_SyncLocationFormField() {
  try {
    syncLocationFormField(FormApp.openByUrl(config.OrderFormUrl));
    notify("Synched location form field");
  } catch (error: any) {
    logError("menu_SyncLocationFormField", error);
  }
}
