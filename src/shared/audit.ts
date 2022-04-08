import camelcase from "camelcase";
import config from "./config";
import { RowEditor } from "./RowEditor";
import { AuditEntry, MessageAuditEntry, ValueChangeAuditEntry } from "./types";

// NOTE: MUST match the order the columns appear in the sheet
const AuditColumns = [
  "Timestamp",
  "Type",
  "Message",
  "Details",
  "Sheet",
  "Column",
  "Old Value",
  "New Value",
] as const;

export function logMessage(message: string, details?: string) {
  audit({ type: "Message", message, details });
}

export function logError(message: string, error: Error);
export function logError(message: string, details?: string);
export function logError(message: string, detailsOrError?: string | Error) {
  audit({
    type: "Error",
    message,
    details:
      typeof detailsOrError === "string"
        ? detailsOrError
        : detailsOrError?.message,
    stack: detailsOrError?.["stack"],
  });
}

export const audit = (entry: MessageAuditEntry | ValueChangeAuditEntry) => {
  entry.timestamp = new Date().toUTCString();

  console.log(JSON.stringify(entry));

  AuditRowEditor.insertRow(entry);

  if (entry.type === "Error" || entry.type === "Message") {
    SpreadsheetApp.getUi().alert(`${entry.message}\r\n${entry.details}`.trim());
  }
};

class AuditRowEditor extends RowEditor<typeof AuditColumns[number]> {
  constructor(rowIndex: number, sheet?: GoogleAppsScript.Spreadsheet.Sheet) {
    super(AuditRowEditor.getSheet(sheet), rowIndex);
  }

  static insertRow = (
    entry: AuditEntry,
    beforePosition = 2,
    sheetParam?: GoogleAppsScript.Spreadsheet.Sheet,
  ): AuditRowEditor => {
    const sheet = AuditRowEditor.getSheet(sheetParam);
    sheet.insertRowBefore(beforePosition);
    const editor = new AuditRowEditor(beforePosition, sheet);
    editor.setValues(AuditColumns.map((col) => entry[camelcase(col)] || ""));
    return editor;
  };

  private static getSheet = (
    sheet?: GoogleAppsScript.Spreadsheet.Sheet,
  ): GoogleAppsScript.Spreadsheet.Sheet =>
    sheet ||
    SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl)?.getSheetByName(
      config.AuditSheetName,
    )!;
}
