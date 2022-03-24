import camelcase from "camelcase";

export function readSpreadsheet<T>(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  sheetName: string,
): T[] {
  const [headers, ...values] = ss
    ?.getSheetByName(sheetName)
    ?.getDataRange()
    ?.getDisplayValues() || [[], []];

  return parseSpreadsheetValues<T>(headers, values);
}

export function parseSpreadsheetValues<T>(
  headers: string[],
  rows: string[][],
): T[] {
  return rows
    .filter((x) => x.every((y) => !!y))
    .map((row) =>
      headers.reduce(
        (obj, header) => ({
          ...obj,
          [camelcase(header)]: row[headers.indexOf(header)],
        }),
        {} as T,
      ),
    );
}

/**
 * @param form
 * @param title
 * @param values the values to replace as the list values
 */
export const updateListField = (
  form: GoogleAppsScript.Forms.Form,
  title: string,
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
