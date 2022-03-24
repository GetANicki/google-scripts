export function menu_ShowOrderSidebar() {
  const html =
    HtmlService.createHtmlOutputFromFile("orders").setTitle("Nicki Orders");
  SpreadsheetApp.getUi().showSidebar(html);
}

export function menu_ManageDrivers() {
  const html =
    HtmlService.createHtmlOutputFromFile("orders").setTitle("Nicki Orders");
  SpreadsheetApp.getUi().showSidebar(html);
}
