const config = {
  AuditSheetName: "Logs",
  CustomersSheetName: "Customers",
  FileStorageFolderId: process.env.SAVED_FILES_FOLDER_ID!,
  LocationsSheetName: "Locations",
  NickiDataSpreadsheetUrl: process.env.NICKIDATA_SPREADSHEET!,
  NickiDriversSheetName: "Nickis",
  OrderFormUrl: process.env.ORDER_FORM_URL!,
  OrdersSheetName: process.env.ORDERS_SHEET_NAME || "Orders",
  OptimoRouteApiKey: process.env.OPTIMOROUTE_APIKEY!,
  StripeApiKey: process.env.STRIPE_APIKEY!,
  DryRun: false,
};

export default config;
