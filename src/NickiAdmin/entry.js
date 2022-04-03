function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu("nickiAdmin");
  Nicki.menuItems.forEach((item) => {
    if (item.name === "separator") {
      menu.addSeparator();
    } else {
      menu.addItem(item.name, item.function);
    }
  });
  menu.addToUi();
}

function onFormSubmit(e) {
  Nicki.onFormSubmit(e);
}

function handleEdit(e) {
  Nicki.onEdit(e);
}

function test() {
  Nicki.saveLocation({ address: "1087 Country Hills Rd, Yardley, PA 19067" });
}
