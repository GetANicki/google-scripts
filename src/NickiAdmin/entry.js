function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("nickiAdmin")
    .addItem("Order Management", "Nicki.showOrderSidebar")
    .addToUi();
}
