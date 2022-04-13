import { getLocation } from "../../services/locations";
import { upsertOrder } from "../../services/optimoroute";
import { notify } from "../../shared/audit";
import { RowEditor } from "../../shared/RowEditor";
import { OrderEntryColumn, OrderStatus } from "../../shared/types";
import { orderEditHandler } from "./orderEditHandler";

export const orderStatusHandler = orderEditHandler(
  (column, newValue, editor) => {
    if (column !== "Status") {
      return;
    }

    const status = newValue as OrderStatus;

    switch (status) {
      case "Confirmed":
        try {
          createOrderInOptimoRoute(editor);
        } catch (ex) {
          // if we fail to create the order in OR, set the status back to Draft to try again
          editor.set("Status", "Draft" as OrderStatus);

          notify(
            "Failed to create order in OptimoRoute - status has been reset to 'Draft'",
          );
        }
        break;
    }
  },
);

const createOrderInOptimoRoute = (editor: RowEditor<OrderEntryColumn>) => {
  const orderId =
    editor.get("Order ID") ||
    `${editor.get("Customer ID").replace(/^cus_/, "")}_${Date.now()}`;

  const date = editor.get<Date>("Pickup Date");

  const pickupLocation = getLocation(
    editor.get("Pickup Location"),
    editor.get("Customer ID"),
  );
  const dropoffLocation = getLocation(
    editor.get("Drop-off Location"),
    editor.get("Customer ID"),
  );

  if (!pickupLocation)
    throw Error(
      "Invalid pickup location - please replace with valid location or address",
    );
  else console.log(`Pickup location: ${JSON.stringify(pickupLocation)}`);
  if (!dropoffLocation)
    throw Error(
      "Invalid drop-off location - please replace with valid location or address",
    );
  else console.log(`Drop-off location: ${JSON.stringify(dropoffLocation)}`);

  upsertOrder(
    orderId,
    {
      date,
      location: pickupLocation,
      duration: editor.get("Pickup Duration"),
      notes: editor.get("Pickup Comments"),
      link: editor.get("Pickup Link"),
      customerName: editor.get("Customer"),
      attachment: editor.get("Attachment"),
      priority: editor.get("Priority"),
      driverId: editor.get("Nicki ID"),
    },
    {
      date,
      location: dropoffLocation,
      duration: editor.get("Drop-off Duration"),
      notes: editor.get("Drop-off Comments"),
      phone: editor.get("Drop-off Phone Number"),
      customerName: editor.get("Customer"),
    },
  );

  editor.set("Order ID", orderId);
  editor.set("Status", "Created" as OrderStatus);
};
