import { audit, logError } from "./audit";

export class RowEditor<TColumnsType extends string> {
  private rowIndex: number;
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private headers: TColumnsType[];

  constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet, rowIndex: number) {
    this.rowIndex = rowIndex;
    this.sheet = sheet;
    this.headers = sheet
      .getRange("1:1")
      .getValues()[0]
      .map((x) => x.trim());
  }

  get = <T = string>(column: TColumnsType): T =>
    this.getCell(column)?.getValue();

  getCell = (column: TColumnsType) => {
    try {
      return this.sheet.getRange(
        this.rowIndex,
        this.headers.indexOf(column.trim() as TColumnsType) + 1,
      );
    } catch (ex: any) {
      logError(`Failed to get column ${column}`, ex);
      throw ex;
    }
  };

  getColumnName = (
    range: GoogleAppsScript.Spreadsheet.Range,
  ): TColumnsType | null => this.headers[range.getColumn() - 1];

  protected getRow = (): GoogleAppsScript.Spreadsheet.Range =>
    this.sheet.getRange(`${this.rowIndex}:${this.rowIndex}`);

  set = (column: TColumnsType, value: any): void => {
    this.getCell(column).setValue(value);

    audit({
      type: "Change",
      column,
      newValue: value,
      sheet: `${this.sheet.getName()}:${this.rowIndex}`,
    });
  };

  setDate = (column: TColumnsType, value: Date): void =>
    this.set(column, new Intl.DateTimeFormat("en-US").format(value));

  setFormula = (
    column: TColumnsType,
    formulaColumns: TColumnsType[],
    formula: (a1Notations: string[]) => string,
  ) => {
    this.getCell(column).setFormula(
      formula(formulaColumns.map((x) => this.getCell(x).getA1Notation())),
    );
  };

  protected setValues = (values: string[]) => {
    const toAdd = Array.from(
      { ...values, length: this.headers.length },
      (x) => x || "",
    );
    this.getRow().setValues([toAdd]);
  };

  lockCells(columnNames: TColumnsType[]) {
    columnNames.forEach((column) =>
      this.getCell(column).protect().setDescription("Auto-Calculated value"),
    );
  }

  unlockCells() {
    this.sheet
      .getProtections(SpreadsheetApp.ProtectionType.RANGE)
      .filter((x) => x.getRange().getRowIndex() === this.rowIndex)
      .forEach((x) => x.remove());
  }

  static createFromRange<TColumnsType extends string>(
    range: GoogleAppsScript.Spreadsheet.Range,
  ): RowEditor<TColumnsType> {
    return new RowEditor<TColumnsType>(range.getSheet(), range.getRowIndex());
  }

  static findById<TColumnsType extends string>(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    id: string,
  ): RowEditor<TColumnsType> | null {
    const locationNos = sheet
      .getRange("A:A")
      .getDisplayValues()
      .flatMap((x) => x);

    const rowIndex = locationNos.indexOf(id);

    if (rowIndex === -1) return null;

    return new RowEditor<TColumnsType>(sheet, rowIndex + 1);
  }
}
