import * as menu from "./menu";

export * from "./menu";

export const menuItems: {
  name: string;
  function: `Nicki.${keyof typeof menu}`;
}[] = [{ name: "Order Management", function: "Nicki.menu_ShowOrderSidebar" }];
