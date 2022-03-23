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
            ""
          )
        : `${e}=${encodeURIComponent(params[e])}`),
    source
  );
