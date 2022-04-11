import { CustomerEditor } from "../../services/customers";
import { updateListField } from "../../shared/googleExt";
import { OrderEntryColumn } from "../../shared/types";

export function syncCustomerFormField(form: GoogleAppsScript.Forms.Form) {
  const customerNames = [...new Set(CustomerEditor.getCustomerNames().sort())];
  updateListField<OrderEntryColumn>(form, "Customer", customerNames);
}
