import { audit, logError } from "./audit";
import config from "./config";

export class RowEditor<TColumnsType extends string> {
  readonly rowIndex: number;
  protected readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  protected readonly headers: TColumnsType[];

  constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet, rowIndex: number) {
    this.rowIndex = rowIndex;
    this.sheet = sheet;
    this.headers = RowEditor.getHeaders(sheet);
  }

  get = <T = string>(column: TColumnsType): T => {
    const value = this.getCell(column)?.getValue();

    if (typeof value === "string") return value?.trim() as any;

    return value;
  };

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
    const cell = this.getCell(column);
    const current = cell.getDisplayValue();

    cell.setValue(value);

    audit({
      type: "Change",
      column,
      newValue: value,
      oldValue: current,
      sheet: `${this.sheet.getName()}:${this.rowIndex}`,
    });
  };

  setActive = (column?: TColumnsType) => {
    const colIndx = column ? this.headers.indexOf(column) + 1 : 1;
    this.sheet
      .getRange(this.rowIndex, colIndx)
      .activateAsCurrentCell()
      .activate();
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

  setIfDifferent = <T>(column: TColumnsType, value: T): void => {
    if (this.get<T>(column) !== value) {
      this.set(column, value);
    }
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

  protected setColumnWidth = (column: TColumnsType, width: number) => {
    this.sheet.setColumnWidth(this.getCell(column).getColumn(), width);
  };

  protected setValues = (values: string[]) => {
    const toAdd = Array.from(
      { ...values, length: this.headers.length },
      (x) => x || "",
    );
    this.getRow().setValues([toAdd]);
  };

  static createFromRange<TColumnsType extends string>(
    range: GoogleAppsScript.Spreadsheet.Range,
  ): RowEditor<TColumnsType> {
    return new RowEditor<TColumnsType>(range.getSheet(), range.getRowIndex());
  }

  static findRowByColumn<TColumnsType extends string>(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    column: TColumnsType | number,
    value: string,
    startingRow: number,
  ): number | null {
    const columnIdx =
      typeof column === "string"
        ? RowEditor.getHeaders(sheet).indexOf(column) + 1
        : column;

    if (columnIdx === -1) {
      throw Error(
        `Unable to find column ${column} in sheet ${sheet.getName()}`,
      );
    }

    const columnA1 = sheet
      .getRange(1, columnIdx, 1, 1)
      .getA1Notation()
      .match(/([A-Z]+)/)?.[0];

    const ids = sheet
      .getRange(`${columnA1}${startingRow}:${columnA1}`)
      .getDisplayValues()
      .flatMap((x) => x);

    const rowIndex = ids.indexOf(value);

    if (rowIndex === -1) return null;

    return rowIndex + 1 + startingRow;
  }

  static getHeaders = (sheet: GoogleAppsScript.Spreadsheet.Sheet) =>
    sheet
      .getRange("1:1")
      .getValues()[0]
      .map((x) => x.trim());

  protected static getSheet = (
    name: string,
    sheet?: GoogleAppsScript.Spreadsheet.Sheet,
  ): GoogleAppsScript.Spreadsheet.Sheet =>
    sheet ||
    SpreadsheetApp.openByUrl(config.NickiDataSpreadsheetUrl)?.getSheetByName(
      name,
    )!;
}
