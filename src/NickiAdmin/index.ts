export { onEdit } from "./onEdit";
export { onFormSubmit } from "./onFormSubmit";

// Menu exports
import * as menu from "./menu";
export const menuItems: {
  name: string;
  function: `Nicki.${keyof typeof menu}`;
}[] = [{ name: "Order Management", function: "Nicki.menu_ShowOrderSidebar" }];
export * from "./menu";

// Orders Management Sidebar
export * from "./ordersManagementSidebar";
