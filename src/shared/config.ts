const config = {
  NickiDataSpreadsheetUrl: process.env.NICKIDATA_SPREADSHEET!,
  NickiDriversSheetName: "Nickis",
  OrdersSheetName: "Form Responses 2",
  OptimoRouteApiKey: process.env.OPTIMOROUTE_APIKEY!,
  StripeApiKey: process.env.STRIPE_APIKEY!,
  DryRun: false,
};

export default config;
