import { updateOrderDrivers } from "./updateOrderDrivers";
import { syncCompletedOrders } from "./syncCompletedOrders";
import { syncExternalFormData } from "../../NickiOrderForm";
import config from "../../shared/config";

export function menu_SyncCompletedOrders() {
  syncCompletedOrders();
}

export function menu_UpdateDriverAssignments() {
  updateOrderDrivers();
}

export function menu_SyncExternalFormData() {
  syncExternalFormData(FormApp.openByUrl(config.OrderFormUrl));
}
