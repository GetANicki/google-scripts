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

export function get<T>(path: string, query?: Record<string, any>): T | null {
  return fetch<T>(path, query);
}

/**
 * Retrieves data from the Stripe API,
 * including fetching additional paged items
 *
 * @param path Stripe API path
 * @param query optional query parameters
 * @returns
 */
export function getAll<T extends { id: string }>(
  path: string,
  query?: Record<string, any>,
): T[] {
  let items: T[] = [];
  let getMore = true;
  let lastId: string | null | undefined = null;

  do {
    const params = {
      ...query,
    };

    if (lastId) {
      params.starting_after = lastId;
    }

    const { data, has_more } = fetch<{ data: T[]; has_more: boolean }>(
      path,
      params,
    );

    items = [...(items || []), ...(data || [])];

    getMore = has_more;
    lastId = data?.reverse()?.find((x: T) => x)?.id;
  } while (getMore);

  return items;
}

const fetch = <T>(path: string, params): T => {
  const url = addQuery(`https://api.stripe.com/v1${path}`, params || {});

  console.log(`FETCH: ${url}...`);

  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: `Bearer ${config.StripeApiKey}`,
    },
  }).getContentText();

  return JSON.parse(response || "");
};
