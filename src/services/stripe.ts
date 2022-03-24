import config from "../shared/config";
import { Customer, Product, Subscription } from "../shared/types";
import { addQuery } from "../shared/util";

export const getProducts = (): Product[] =>
  getAll("/products", { limit: 100, active: true });

export const getSubscriptions = (): Subscription[] =>
  getAll("/subscriptions", { limit: 100 });

export const getActivePlan = (
  customer: Customer,
  products: Product[],
  subscriptions: Subscription[],
): Product | null => {
  if (!customer || !products?.length || !subscriptions?.length) return null;

  const mySubscriptions = subscriptions?.filter(
    (sub) => sub.customer === customer.id && sub.plan?.active === true,
  );

  const myProductIds = mySubscriptions?.map((sub) => sub.plan?.product);

  const myProducts = products?.filter((x) => myProductIds?.includes(x.id));

  return myProducts?.find((x) => x) || null;
};

/**
 * Retrieves data from the Stripe API,
 * including fetching additional paged items
 *
 * @param path Stripe API path
 * @param query optional query parameters
 * @returns
 */
export function getAll(path: string, query?: Record<string, any>) {
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
        Authorization: `Bearer ${config.StripeApiKey}`,
      },
    }).getContentText();

    const { data, has_more } = JSON.parse(response);

    items = [...items, ...data];

    getMore = has_more;
    lastId = data.reverse().find((x) => x).id;
  } while (getMore);

  return items;
}
