import { logError, notify } from "../../shared/audit";
import config from "../../shared/config";
import { syncCompletedOrders } from "./syncCompletedOrders";
import { syncCustomers } from "./syncCustomers";
import { syncLocationFormField } from "./syncLocationFormField";
import { updateOrderDrivers } from "./updateOrderDrivers";
import { formatCurrentRow } from "./formatCurrentRow";

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

export function menu_SyncCustomers() {
  try {
    syncCustomers(FormApp.openByUrl(config.OrderFormUrl));
    notify("Synched customers");
  } catch (error: any) {
    logError("menu_SyncCustomers", error);
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
