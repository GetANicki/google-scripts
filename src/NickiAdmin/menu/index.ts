import { logError, logMessage } from "../../shared/audit";
import config from "../../shared/config";
import { syncCompletedOrders } from "./syncCompletedOrders";
import { syncCustomerFormField } from "./syncCustomerFormField";
import { syncLocationFormField } from "./syncLocationFormField";
import { updateOrderDrivers } from "./updateOrderDrivers";

export function menu_SyncCompletedOrders() {
  try {
    syncCompletedOrders();
    logMessage("Updated Completed Orders");
  } catch (error: any) {
    logError("menu_SyncCompletedOrders", error);
  }
}

export function menu_UpdateDriverAssignments() {
  try {
    updateOrderDrivers();
    logMessage("Updated Order Drivers");
  } catch (error: any) {
    logError("menu_UpdateDriverAssignments", error);
  }
}

export function menu_SyncCustomerFormField() {
  try {
    const timestamp = Date.now();
    syncCustomerFormField(FormApp.openByUrl(config.OrderFormUrl));
    logMessage(
      "Synched customer form field",
      `Elapsed: ${Date.now() - timestamp}ms`,
    );
  } catch (error: any) {
    logError("menu_SyncCustomerFormField", error);
  }
}

export function menu_SyncLocationFormField() {
  try {
    const timestamp = Date.now();
    syncLocationFormField(FormApp.openByUrl(config.OrderFormUrl));
    logMessage(
      "Synched location form field",
      `Elapsed: ${Date.now() - timestamp}ms`,
    );
  } catch (error: any) {
    logError("menu_SyncLocationFormField", error);
  }
}
