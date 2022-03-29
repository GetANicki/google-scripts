export class RowEditor<TColumnsType> {
  private rowIndex: number;
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private headers: TColumnsType[];

  constructor(range: GoogleAppsScript.Spreadsheet.Range) {
    this.rowIndex = range.getRowIndex();
    this.sheet = range.getSheet();
    this.headers = this.sheet.getRange("1:1").getValues()[0];
  }

  get = <T = string>(column: TColumnsType): T =>
    this.getCell(column)?.getValue();

  getCell = (column: TColumnsType) =>
    this.sheet.getRange(this.rowIndex, this.headers.indexOf(column) + 1);

  getColumnName = (
    range: GoogleAppsScript.Spreadsheet.Range,
  ): TColumnsType | null => this.headers[range.getColumn() - 1];

  set = (column: TColumnsType, value: any): void => {
    this.getCell(column).setValue(value);
    console.log(`Set ${column}: `, value);
  };

  setFormula = (
    column: TColumnsType,
    formulaColumns: TColumnsType[],
    formula: (a1Notations: string[]) => string,
  ) => {
    this.getCell(column).setFormula(
      formula(formulaColumns.map((x) => this.getCell(x).getA1Notation())),
    );
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
}
