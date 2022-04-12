export { onEdit } from "./onEdit";
export { onFormSubmit } from "./onFormSubmit";
export { logError } from "../shared/audit";

// Menu exports
export * from "./menu";
import * as menu from "./menu";
export const menuItems: (
  | {
      name: string;
      function: `Nicki.${keyof typeof menu}`;
    }
  | { name: "separator" }
)[] = [
  {
    name: "Add new Order",
    function: "Nicki.menu_AddOrder",
  },
  {
    name: "Upload File",
    function: "Nicki.menu_UploadFile",
  },
  {
    name: "Sync OptimoRoute Nicki Assignments",
    function: "Nicki.menu_UpdateDriverAssignments",
  },
  {
    name: "Sync Delivered Orders",
    function: "Nicki.menu_SyncCompletedOrders",
  },
  {
    name: "(Re)Format current row",
    function: "Nicki.menu_FormatCurrentRow",
  },
  { name: "separator" },
  {
    name: "Sync Customers from Stripe",
    function: "Nicki.menu_SyncCustomersFromStripe",
  },
  {
    name: "Sync Customers Form Field",
    function: "Nicki.menu_SyncCustomerFormField",
  },
  {
    name: "Sync Location Form Field",
    function: "Nicki.menu_SyncLocationFormField",
  },
];

// FOR TESTING:
export { saveLocation, getLocation } from "../services/locations";
export { CustomerEditor } from "../services/customers";
