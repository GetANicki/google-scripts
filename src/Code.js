/** @typedef {object} Customer
 *  @property {string} id
 *  @property {string} name
 *  @property {string | null} phone
 *  @property {string | null} email
 *  @property {string | null} plan
 */

function onFormSubmit() {
  const form = FormApp.getActiveForm();

  const formResponses = form.getResponses();

  const serviceFee = calculateServiceFee();
  console.log(serviceFee);
}

/** to be run as a timed service to pick up any (infrequent) changes */
function syncExternalData() {
  const form = FormApp.getActiveForm();
  const ss = SpreadsheetApp.openByUrl(DriverSpreadsheetUrl);

  const products = getProducts();
  const subscriptions = getSubscriptions();
  const customers = getCustomers(products, subscriptions);
  const driverNames = getDriverNames(ss);

  updateCustomerField(form, customers);
  updateDriverField(form, driverNames);
  updateServiceField(form, products);
}

const updateCustomerField = (form, customers) => {
  const customerNames = [...new Set(customers.map((x) => x.displayName))];
  updateListField(form, "Customer", customerNames);
};

const updateDriverField = (form, driverNames) => {
  updateListField(form, "Nicki", driverNames);
};

const updateServiceField = (form, products) => {
  const services = products?.filter((x) => x.metadata?.type === "service");
  const serviceNames = services.map((x) => x.name);
  updateListField(form, "Service", serviceNames);
};

const getProducts = () =>
  stripeGetAll("/products", { limit: 100, active: true });

const getSubscriptions = () => stripeGetAll("/subscriptions", { limit: 100 });

/**
 * @param {Product[]} products all available products
 * @param {Subscription[]} subscriptions all available subscriptions
 * @returns {Customer[]}
 */
const getCustomers = (products, subscriptions) =>
  stripeGetAll("/customers", { limit: 100 })
    .map((customer) => mapCustomer(customer, subscriptions, products))
    .sort((x, y) => (x.displayName > y.displayName ? 1 : -1));

/**
 * @param {Customer} customer
 * @param {Product[]} products all available products
 * @param {Subscription[]} subscriptions all available subscriptions
 * @returns {Customer}
 */
const mapCustomer = (customer, products, subscriptions) => {
  const mySubscriptions = subscriptions?.filter(
    (sub) => sub.customer === customer.id && sub.plan?.active === true
  );

  const myProductIds = mySubscriptions?.map((sub) => sub.plan?.product);

  const myProducts = products?.filter((x) => myProductIds?.includes(x.id));

  const activePlan = myProducts.map((x) => x.name).find((x) => x);

  const planName = activePlan ? `[${activePlan}]` : "";

  const address = onelineAddress(customer.address);

  let contact = address || customer.phone || customer.email || customer.id;
  contact = contact ? `- ${contact}` : "";

  const displayName = [customer.name, planName, contact].filter((x) => !!x).join(" ");

  return {
    ...customer,
    displayName,
    activePlan,
    products: myProducts,
    subscriptions: mySubscriptions,
  };
};

const onelineAddress = (address) =>
  address
    ? [
        `${address.line1} ${address.line2}`.trim(),
        address.city,
        address.state,
        address.postal_code,
        address.country,
      ].join(", ")
    : null;

/**
 * Retrieves data from the Stripe API,
 * including fetching additional paged items
 *
 * @param {string} path Stripe API path
 * @param {string[]=} query optional query parameters
 * @returns
 */
function stripeGetAll(path, query) {
  let items = [];

  let getMore = true;
  let lastId = null;

  do {
    let params = {
      ...query,
    };

    if (lastId) {
      params.starting_after = lastId;
    }

    let url = `https://api.stripe.com/v1${path}`.addQuery(params);

    console.log("Retrieving ", url);

    const response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: `Bearer ${StripeApiKey}`,
      },
    }).getContentText();

    const { data, has_more } = JSON.parse(response);

    items = [...items, ...data];

    getMore = has_more;
    lastId = data.reverse().find((x) => x).id;
  } while (getMore);

  return items;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @returns {string[]}
 */
const getDriverNames = (ss) => {
  const [headers, ...values] = ss
    .getSheetByName("Drivers")
    .getDataRange()
    .getDisplayValues();

  const firstNameColumn = headers.indexOf("First Name");
  const lastNameColumn = headers.indexOf("Last Name");

  return values
    .map(
      (d) =>
        `${d[firstNameColumn]} ${
          d[lastNameColumn] ? d[lastNameColumn].charAt(0) + "." : ""
        }`
    )
    .filter((e) => e?.trim().length)
    .sort();
};

/**
 * @param {GoogleAppsScript.Forms.Form} form
 * @param {string} title
 * @param {string[]} values the values to replace as the list values
 */
const updateListField = (form, title, values) => {
  const field = form
    .getItems()
    .filter((x) => x.getTitle() === title)
    .map((x) => x.asListItem())
    .find((x) => !!x);

  field.setChoiceValues(values);

  console.log(`Updated field ${title}:\r\n\t`, values.join("\r\n\t"));
};

String.prototype.addQuery = function (obj) {
  return (
    this +
    Object.keys(obj).reduce(function (p, e, i) {
      return (
        p +
        (i == 0 ? "?" : "&") +
        (Array.isArray(obj[e])
          ? obj[e].reduce(function (str, f, j) {
              return (
                str +
                e +
                "=" +
                encodeURIComponent(f) +
                (j != obj[e].length - 1 ? "&" : "")
              );
            }, "")
          : e + "=" + encodeURIComponent(obj[e]))
      );
    }, "")
  );
};
