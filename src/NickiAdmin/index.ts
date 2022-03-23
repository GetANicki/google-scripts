export function showOrderSidebar() {
    var html = HtmlService.createHtmlOutputFromFile("orders").setTitle("Nicki Orders");
    SpreadsheetApp.getUi().showSidebar(html);
}
