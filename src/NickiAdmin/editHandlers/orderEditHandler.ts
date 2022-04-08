import { OrderEditor } from "../../services/orders";
import config from "../../shared/config";
import { OrderEntryColumn } from "../../shared/types";

export const orderEditHandler =
  (
    handler: (
      column: OrderEntryColumn,
      newValue: string,
      editor: OrderEditor,
      evt: GoogleAppsScript.Events.SheetsOnEdit,
    ) => void,
  ) =>
  (evt: GoogleAppsScript.Events.SheetsOnEdit) => {
    if (evt.range.getSheet().getName() !== config.OrdersSheetName) {
      return;
    }

    const editor = new OrderEditor(evt.range.getRowIndex());
    const changedColumn = editor.getColumnName(evt.range) as OrderEntryColumn;
    const newValue = evt.value;

    handler(changedColumn, newValue, editor, evt);
  };
