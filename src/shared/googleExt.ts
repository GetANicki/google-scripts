import camelcase from "camelcase";
import { Row } from "./types";

export function readSpreadsheet<T>(
  ss: GoogleAppsScript.Spreadsheet.Sheet,
): Row<T>[] {
  const [headers, ...values] = ss?.getDataRange()?.getDisplayValues() || [
    [],
    [],
  ];

  return parseSpreadsheetValues<T>(headers, values);
}

export function parseSpreadsheetValues<T>(
  headers: string[],
  rows: string[][],
): Row<T>[] {
  return rows.map((row, idx) =>
    headers.reduce(
      (obj, header) => ({
        ...obj,
        [camelcase(header)]: row[headers.indexOf(header)],
      }),
      { __row: idx + 2 } as Row<T>, // +2 = +1 for 0->1 based index, +1 to skip header row
    ),
  );
}

/**
 * @param form
 * @param title
 * @param values the values to replace as the list values
 */
export const updateListField = <TColumnName extends string = string>(
  form: GoogleAppsScript.Forms.Form,
  title: TColumnName,
  values: string[],
) => {
  const field = form
    .getItems()
    .filter((x) => x.getTitle() === title)
    .map((x) => x.asListItem())
    .find((x) => !!x);

  if (field) {
    field.setChoiceValues(values);
  } else {
    console.log("Unable to find field", title);
  }

  console.log(`Updated field ${title}:\r\n\t`, values.join("\r\n\t"));
};

export function formatAsCurrency(
  ...ranges: GoogleAppsScript.Spreadsheet.Range[]
) {
  ranges.forEach((x) => x.setNumberFormat("$#,##0.00;$(#,##0.00)"));
}

export function formatAsTimeWindow(
  ...ranges: GoogleAppsScript.Spreadsheet.Range[]
) {
  ranges.forEach((x) => x.setNumberFormat("@STRING@"));
}
