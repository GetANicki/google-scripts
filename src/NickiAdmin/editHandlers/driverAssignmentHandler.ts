import { findDriverByName } from "../../services/drivers";
import { orderEditHandler } from "./orderEditHandler";

export const driverAssignmentHandler = orderEditHandler(
  (column, newValue, editor) => {
    switch (column) {
      case "Nicki":
        editor.assignDriver(findDriverByName(newValue.trim()));
        break;
    }
  },
);
