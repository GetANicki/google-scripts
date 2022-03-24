function onOpen() {
  ScriptApp.getProjectTriggers()
    .filter(
      (x) =>
        x.getHandlerFunction() === "onFormSubmit" ||
        x.getHandlerFunction() === "syncExternalData",
    )
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("syncExternalData").timeBased().everyDays(1).create();
}

function syncExternalData() {
  Nicki.syncExternalData();
}
