import { updateOrderDrivers } from "./updateOrderDrivers";
import { syncCompletedOrders } from "./syncCompletedOrders";

export function menu_SyncCompletedOrders() {
  syncCompletedOrders();
}

export function menu_UpdateDriverAssignments() {
  updateOrderDrivers();
}
