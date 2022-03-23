export function showOrderSidebar() {
  const html =
    HtmlService.createHtmlOutputFromFile("orders").setTitle("Nicki Orders");
  SpreadsheetApp.getUi().showSidebar(html);
}
