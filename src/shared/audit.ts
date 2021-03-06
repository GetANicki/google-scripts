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

export function notify(message: string, details?: string) {
  audit({ type: "Notification", message, details });
}

export const audit = (entry: MessageAuditEntry | ValueChangeAuditEntry) => {
  entry.timestamp = new Date().toUTCString();

  console.log(JSON.stringify(entry));

  if (entry.type !== "Change") {
    AuditRowEditor.insertRow(entry);
  }

  if (entry.type === "Error" || entry.type === "Notification") {
    try {
      SpreadsheetApp.getUi().alert(
        [entry.message, entry.details].join("\r\n").trim(),
      );
    } catch (ex) {
      // NOOP
    }
  }
};

class AuditRowEditor extends RowEditor<typeof AuditColumns[number]> {
  constructor(rowIndex: number, sheet?: GoogleAppsScript.Spreadsheet.Sheet) {
    super(AuditRowEditor.getAuditSheet(sheet), rowIndex);
  }

  static insertRow = (
    entry: AuditEntry,
    beforePosition = 2,
    sheetParam?: GoogleAppsScript.Spreadsheet.Sheet,
  ): AuditRowEditor => {
    const sheet = AuditRowEditor.getAuditSheet(sheetParam);
    sheet.insertRowBefore(beforePosition);
    const editor = new AuditRowEditor(beforePosition, sheet);
    editor.setValues(AuditColumns.map((col) => entry[camelcase(col)] || ""));
    return editor;
  };

  private static getAuditSheet = (
    sheet?: GoogleAppsScript.Spreadsheet.Sheet,
  ): GoogleAppsScript.Spreadsheet.Sheet =>
    RowEditor.getSheet(config.AuditSheetName, sheet);
}
