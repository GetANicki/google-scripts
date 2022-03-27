import { OrderEntryColumn, OrderStatus, OrderStatuses } from "../shared/types";

const LockedColumns: OrderEntryColumn[] = [
  "Created",
  "Created By",
  "Customer",
  "Customer ID",
  "Nicki Gross",
  "Nicki ID",
  "Nicki Net",
  "Order ID",
  "Service",
  "Service ID",
  "Service Price",
  "Surcharge",
];

export function onFormSubmit({
  namedValues,
  range,
}: Omit<GoogleAppsScript.Events.SheetsOnFormSubmit, "namedValues"> & {
  namedValues: Record<OrderEntryColumn, string>;
}) {
  console.log("Processing form submission for row ", range.getRowIndex());
  const editor = new RowEditor(range);

  unlockCalculatedCells(editor);

  try {
    const timestamp = Date.now();

    if (!editor.get("Created")) {
      editor.set(
        "Created",
        new Date(timestamp)
          .toLocaleString("en-US", { hour12: false })
          .replace(",", ""),
      );

      editor.set("Created By", Session.getActiveUser().getEmail());

      editor.set("Status", "Draft" as OrderStatus);
    }

    const customerId = extractId(namedValues["Customer"]);
    if (customerId) {
      const orderId = `${customerId}_${timestamp}`;
      editor.set("Order ID", orderId);
      editor.set("Customer ID", customerId);
      editor.set(
        "Customer",
        editor.get("Customer")?.replace(` (${customerId})`, ""),
      );
    }

    const serviceId = extractId(namedValues["Service"]);
    if (serviceId) {
      editor.set("Service ID", serviceId);
      editor.set(
        "Service",
        editor.get("Service")?.replace(` (${serviceId})`, ""),
      );
    }

    const nickiId = extractId(namedValues["Nicki"]);
    if (nickiId) {
      editor.set("Nicki ID", nickiId);
    }

    // Set status filter
    const statusValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList([...OrderStatuses])
      .build();
    editor.getCell("Status").setDataValidation(statusValidation);

    // set formulas in calculated fields
    const transactionCell = editor.getCell("Transaction");
    const surchargeCell = editor.getCell("Surcharge");
    const servicePriceCell = editor.getCell("Service Price");
    const nickiGrossCell = editor.getCell("Nicki Gross");
    const nickiNetCell = editor.getCell("Nicki Net");

    formatAsCurrency(
      transactionCell,
      surchargeCell,
      servicePriceCell,
      nickiGrossCell,
      nickiNetCell,
    );

    nickiGrossCell.setFormula(
      `=${transactionCell.getA1Notation()} + ${surchargeCell.getA1Notation()} + ${servicePriceCell.getA1Notation()}`,
    );

    nickiNetCell.setFormula(
      `=${nickiGrossCell.getA1Notation()} - ${transactionCell.getA1Notation()}`,
    );
  } finally {
  }

  lockCalculatedCells(editor, LockedColumns);
}

function formatAsCurrency(...ranges: GoogleAppsScript.Spreadsheet.Range[]) {
  ranges.forEach((x) => x.setNumberFormat("$#,##0.00;$(#,##0.00)"));
}

function lockCalculatedCells(
  editor: RowEditor,
  columnNames: OrderEntryColumn[],
) {
  columnNames.forEach((column) =>
    editor.getCell(column).protect().setDescription("Auto-Calculated value"),
  );
}
function unlockCalculatedCells(_editor: RowEditor) {
  SpreadsheetApp.getActive()
    .getProtections(SpreadsheetApp.ProtectionType.RANGE)
    .forEach((x) => x.remove());
}

class RowEditor {
  private rowIndex: number;
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private headers: OrderEntryColumn[];

  constructor(range: GoogleAppsScript.Spreadsheet.Range) {
    this.rowIndex = range.getRowIndex();
    this.sheet = range.getSheet();
    this.headers = this.sheet.getRange("1:1").getValues()[0];
  }

  getCell = (column: OrderEntryColumn) =>
    this.sheet.getRange(this.rowIndex, this.headers.indexOf(column) + 1);

  get = (column: OrderEntryColumn) => this.getCell(column)?.getValue();

  set = (column: OrderEntryColumn, value: any) => {
    this.getCell(column).setValue(value);
    console.log(`Set ${column}: `, value);
  };
}

// extracts an id from a name in "<Name> (<Id>)" format
const extractId = (x: string): string | null =>
  /.+\((.*?)\)/gi.exec(x)?.[1] || null;
