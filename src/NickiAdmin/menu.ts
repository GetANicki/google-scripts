import { OrderManagementViewModel } from "./ordersManagementSidebar";

export function menu_ShowOrderSidebar() {
  const html =
    HtmlService.createHtmlOutputFromFile("orders").setTitle("Nicki Orders");
  SpreadsheetApp.getUi().showSidebar(html);
}

export function menu_ManageDrivers() {
  const model = new OrderManagementViewModel();
  model.init();

  const t = HtmlService.createTemplateFromFile("orders");
  t.model = model;

  const html = t.evaluate().setTitle("Nicki Orders");
  SpreadsheetApp.getUi().showSidebar(html);
}
