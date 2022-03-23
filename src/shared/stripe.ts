import { StripeApiKey } from "./secrets";
import { Customer, Product, Subscription } from "./types";
import { addQuery } from "./util";

export const getProducts = (): Product[] =>
  stripeGetAll("/products", { limit: 100, active: true });

export const getSubscriptions = (): Subscription[] =>
  stripeGetAll("/subscriptions", { limit: 100 });

export const getCustomers = (
  products: Product[],
  subscriptions: Subscription[]
): Customer[] =>
  stripeGetAll("/customers", { limit: 100 })
    .map((customer) => mapCustomer(customer, subscriptions, products))
    .sort((x, y) => (x.displayName! > y.displayName! ? 1 : -1));

/**
 * @param {Customer} customer
 * @param {Product[]} products all available products
 * @param {Subscription[]} subscriptions all available subscriptions
 * @returns {Customer}
 */
const mapCustomer = (
  customer: Customer,
  products: Product[],
  subscriptions: Subscription[]
): Customer => {
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

  const displayName = [customer.name, planName, contact]
    .filter((x) => !!x)
    .join(" ");

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
 * @param path Stripe API path
 * @param query optional query parameters
 * @returns
 */
function stripeGetAll(path: string, query?: Record<string, any>) {
  let items: any[] = [];

  let getMore = true;
  let lastId = null;

  do {
    const params = {
      ...query,
    };

    if (lastId) {
      params.starting_after = lastId;
    }

    const url = addQuery(`https://api.stripe.com/v1${path}`, params);

    Logger.log("Retrieving ", url);

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
