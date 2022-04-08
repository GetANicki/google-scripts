import { OrderEditor } from "../../services/orders";
import { notify } from "../../shared/audit";

export const formatCurrentRow = () => {
  const row = SpreadsheetApp.getSelection().getCurrentCell()?.getRow();

  if (!row) {
    SpreadsheetApp.getUi().alert("Please select a row to format");
    return;
  }

  new OrderEditor(row).formatCells();

  notify(`Formatted row`, `Row #: ${row}`);
};
