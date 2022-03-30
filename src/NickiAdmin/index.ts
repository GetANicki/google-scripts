export { onEdit } from "./onEdit";
export { onFormSubmit } from "./onFormSubmit";

// Menu exports
export * from "./menu";
import * as menu from "./menu";
export const menuItems: {
  name: string;
  function: `Nicki.${keyof typeof menu}`;
}[] = [
  {
    name: "Sync OptimoRoute Nicki Assignments",
    function: "Nicki.menu_UpdateDriverAssignments",
  },
  {
    name: "Sync Delivered Orders",
    function: "Nicki.menu_SyncCompletedOrders",
  },
];

export { getOrders } from "../services/orders";
