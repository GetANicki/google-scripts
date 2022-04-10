import { CustomerEditor } from "../../services/customers";
import { orderEditHandler } from "./orderEditHandler";

export const orderCustomerChangeHandler = orderEditHandler(
  (column, newValue, editor) => {
    switch (column) {
      case "Customer":
        editor.assignCustomer(
          CustomerEditor.findCustomerByName(newValue.trim()),
        );
        break;
    }
  },
);
