import config from "../shared/config";
import { addQuery, shortDate } from "../shared/util";

export interface OptimoRouteOrder {
  date: Date;
  location: {
    locationNo?: string;
    locationName?: string;
    address: string;
  };
  duration?: number;
  notes?: string;
  phone?: string;
  link?: string;
  customerName?: string;
  attachment?: string;
}

export interface OptimoRouteRouteInfo {
  routes: {
    driverSerial: string;
    driverName: string;
    stops: {
      orderNo: string;
    }[];
  }[];
}

export const upsertOrder = (
  orderNo: string,
  pickup: OptimoRouteOrder,
  delivery: OptimoRouteOrder,
) => {
  // schedule pickup
  fetch("/create_order", {
    method: "post",
    payload: {
      operation: "MERGE",
      orderNo: orderNo,
      type: "P",
      date: shortDate(pickup.date || new Date()),
      location: {
        address: pickup.location,
        acceptPartialMatch: true,
        acceptMultipleResults: true,
      },
      duration: (pickup.duration && +pickup.duration) || 5,
      notes: pickup.notes,
      customField1: pickup.link,
      customField2: pickup.attachment,
      customField4: pickup.customerName,
    },
  });

  // schedule delivery (related to pickup)
  fetch("/create_order", {
    method: "post",
    payload: {
      operation: "MERGE",
      orderNo: `${orderNo}_D`,
      relatedOrderNo: orderNo,
      type: "D",
      date: shortDate(delivery.date || pickup.date || new Date()),
      location: {
        address: delivery.location,
        acceptPartialMatch: true,
        acceptMultipleResults: true,
      },
      duration: (delivery.duration && +delivery.duration) || 5,
      notes: delivery.notes,
      phone: delivery.phone,
      customField1: delivery.link,
      customField4: delivery.customerName || pickup.customerName,
    },
  });
};

export interface OptimoRouteFile {
  url: string;
  type: string;
}
export interface CompletedOrderDetails {
  orderNo: string;
  success: boolean;
  data: {
    status: "scheduled" | "success";
    endTime?: {
      utcTime: string;
      utcTimestamp: number;
      localTime: string;
    };
    form?: {
      note?: string;
      signature?: OptimoRouteFile;
      images?: OptimoRouteFile[];
    };
    tracking_url?: string;
  };
}

export const getCompletedOrderDetails = (
  orderIds: string[],
): CompletedOrderDetails[] =>
  fetch<{
    orders: CompletedOrderDetails[];
  }>("/get_completion_details", {
    method: "post",
    payload: {
      orders: orderIds.map((orderNo) => ({ orderNo })),
    },
  })?.orders.filter((x) => x.data?.status === "success");

export const getRoutes = (date: Date) =>
  fetch<OptimoRouteRouteInfo>("/get_routes", {
    params: { date: shortDate(date) },
    method: "get",
  });

const fetch = <T>(
  path: string,
  {
    params,
    ...opts
  }: {
    params?: object;
    method: GoogleAppsScript.URL_Fetch.HttpMethod;
    payload?: GoogleAppsScript.URL_Fetch.Payload;
  },
): T => {
  const url = addQuery(`https://api.optimoroute.com/v1${path}`, {
    key: config.OptimoRouteApiKey,
    ...(params || {}),
  });

  console.log(`FETCH: ${url}...`);

  if (config.DryRun) {
    console.log(`OPTS: ${JSON.stringify(opts)}`);
    return {} as any;
  } else {
    console.log(`Payload: ${JSON.stringify(opts?.payload)}`);

    const response = UrlFetchApp.fetch(url, {
      ...opts,
      payload: opts?.payload ? JSON.stringify(opts.payload) : undefined,
      headers: {
        "Content-Type": "application/json",
      },
    }).getContentText();

    const body = JSON.parse(response || "");

    if (body?.success === false) {
      console.log(`OptimoRoute ERROR: ${response}`);
      throw Error(`OptimoRoute API Error: ${response}`);
    }

    return body as T;
  }
};
