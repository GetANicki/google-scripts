import { CustomerEditor } from "../../services/customers";
import { trim } from "../../shared/util";
import { orderEditHandler } from "./orderEditHandler";

export const orderCustomerChangeHandler = orderEditHandler(
  (column, newValue, editor) => {
    switch (column) {
      case "Customer":
        editor.assignCustomer(
          CustomerEditor.findCustomerByName(trim(newValue)),
        );
        break;
    }
  },
);
