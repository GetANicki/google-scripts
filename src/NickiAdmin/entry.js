function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu("nickiAdmin");
  Nicki.menuItems.forEach((item) => menu.addItem(item.name, item.function));
  menu.addToUi();
}

function onFormSubmit(e) {
  Nicki.onFormSubmit(e);
}
