import { findDriverByName } from "../../services/drivers";
import { trim } from "../../shared/util";
import { orderEditHandler } from "./orderEditHandler";

export const orderDriverAssignmentHandler = orderEditHandler(
  (column, newValue, editor) => {
    switch (column) {
      case "Nicki":
        editor.assignDriver(findDriverByName(trim(newValue)));
        break;
    }
  },
);
