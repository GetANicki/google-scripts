

export const addQuery = (source: string, params: string): string =>
    Object.keys(params).reduce(function (p, e, i) {
        return (
            p +
            (i == 0 ? "?" : "&") +
            (Array.isArray(params[e])
                ? params[e].reduce(function (str, f, j) {
                    return (
                        str +
                        e +
                        "=" +
                        encodeURIComponent(f) +
                        (j != params[e].length - 1 ? "&" : "")
                    );
                }, "")
                : e + "=" + encodeURIComponent(params[e]))
        );
    }, source)
