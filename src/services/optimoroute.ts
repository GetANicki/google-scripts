import { logMessage } from "../shared/audit";
import config from "../shared/config";
import { Location } from "../shared/types";
import { addQuery, shortDate } from "../shared/util";
import { HomeLocationNoSuffix, saveLocation } from "./locations";

export interface OptimoRouteFile {
  url: string;
  type: string;
}
export interface OptimoCompletedOrderDetails {
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

export interface OptimoRouteOrder {
  date: Date;
  location: Location;
  duration?: number;
  notes?: string;
  phone?: string;
  link?: string;
  customerName?: string;
  attachment?: string;
}

export interface OptimoRouteInfo {
  routes: {
    driverSerial: string;
    driverName: string;
    stops: {
      orderNo: string;
    }[];
  }[];
}

interface OptimoCreateRouteResponse {
  location: {
    locationName: string;
    valid: boolean;
    longitude: number;
    address: string;
    latitude: number;
    checkInTime: number;
    notes: string;
    locationNo: string;
  };
  success: boolean;
  mode: string;
}

export const upsertOrder = (
  orderNo: string,
  pickup: OptimoRouteOrder,
  delivery: OptimoRouteOrder,
) => {
  // schedule pickup
  const pickupOrder = fetch<OptimoCreateRouteResponse>("/create_order", {
    method: "post",
    payload: {
      operation: "MERGE",
      orderNo: orderNo,
      type: "P",
      date: shortDate(pickup.date || new Date()),
      location: {
        ...sanitizeLocation(pickup.location),
        acceptPartialMatch: !pickup.location.latitude,
        acceptMultipleResults: !pickup.location.latitude,
      },
      duration: (pickup.duration && +pickup.duration) || 5,
      notes: pickup.notes,
      customField1: pickup.link,
      customField2: pickup.attachment,
      customField4: pickup.customerName,
    },
  });

  logMessage(
    `Scheduled pickup ${orderNo} for ${pickup.customerName}`,
    JSON.stringify(pickupOrder),
  );

  // schedule delivery (related to pickup)
  const deliveryOrder = fetch<OptimoCreateRouteResponse>("/create_order", {
    method: "post",
    payload: {
      operation: "MERGE",
      orderNo: `${orderNo}_D`,
      relatedOrderNo: orderNo,
      type: "D",
      date: shortDate(delivery.date || pickup.date || new Date()),
      location: {
        ...sanitizeLocation(delivery.location),
        acceptPartialMatch: !delivery.location.latitude,
        acceptMultipleResults: !delivery.location.latitude,
      },
      duration: (delivery.duration && +delivery.duration) || 5,
      notes: delivery.notes,
      phone: delivery.phone,
      customField1: delivery.link,
      customField4: delivery.customerName || pickup.customerName,
    },
  });
  logMessage(
    `Scheduled delivery ${orderNo}_D for ${
      delivery.customerName || pickup.customerName
    }`,
    JSON.stringify(deliveryOrder),
  );

  // save location (or update existing location with correct lat/long),
  // but only if they are not home addresses
  if (
    !!pickupOrder.location?.locationNo &&
    !pickupOrder.location.locationNo.endsWith(HomeLocationNoSuffix)
  ) {
    saveLocation(pickupOrder.location);
  } else {
    console.log(
      `Skipping updating pickup location ${pickupOrder.location?.locationNo}`,
    );
  }

  if (
    !!deliveryOrder.location?.locationNo &&
    !deliveryOrder.location.locationNo.endsWith(HomeLocationNoSuffix)
  ) {
    saveLocation(deliveryOrder.location);
  } else {
    console.log(
      `Skipping updating delivery location ${deliveryOrder.location?.locationNo}`,
    );
  }
};

// removes unset/invalid properties from location (e.g. empty lat/long)
const sanitizeLocation = (location: Location) =>
  Object.keys(location)
    // exclude lat and long for now
    .filter((x) => !["latitude", "longitude"].includes(x))
    .reduce((acc, x) => (location[x] ? { ...acc, [x]: location[x] } : acc), {});

export const getCompletedOrderDetails = (
  orderIds: string[],
): OptimoCompletedOrderDetails[] =>
  fetch<{
    orders: OptimoCompletedOrderDetails[];
  }>("/get_completion_details", {
    method: "post",
    payload: {
      orders: orderIds.map((orderNo) => ({ orderNo })),
    },
  })?.orders.filter((x) => x.data?.status === "success");

export const getRoutes = (date: Date) =>
  fetch<OptimoRouteInfo>("/get_routes", {
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
    });

    if (response.getResponseCode() > 302) {
      throw Error(`OptimoRoute API Error: ${JSON.stringify(response)}`);
    }

    const body = JSON.parse(response.getContentText() || "");

    if (body?.success === false) {
      throw Error(`OptimoRoute API Error: ${response}`);
    }

    return body as T;
  }
};
