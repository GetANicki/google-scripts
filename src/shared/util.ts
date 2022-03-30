import { Address } from "./types";

export const addQuery = (source: string, params: object): string =>
  Object.keys(params).reduce(
    (p, e, i) =>
      p +
      (i === 0 ? "?" : "&") +
      (Array.isArray(params[e])
        ? (params[e] as string[]).reduce(
            (str, f, j) =>
              `${str + e}=${encodeURIComponent(f)}${
                j !== params[e].length - 1 ? "&" : ""
              }`,
            "",
          )
        : `${e}=${encodeURIComponent(params[e])}`),
    source,
  );

export const shortDate = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const onelineAddress = (
  address: Address | null | undefined,
): string | null =>
  address
    ? [
        `${address.line1} ${address.line2}`.trim(),
        address.city,
        address.state,
        address.postal_code,
        address.country,
      ].join(", ")
    : null;
