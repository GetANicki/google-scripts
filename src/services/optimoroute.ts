import { text } from "stream/consumers";
import { logMessage } from "../shared/audit";
import config from "../shared/config";
import { Location, OrderPriority } from "../shared/types";
import { addQuery, shortDate } from "../shared/util";
import { UnassignedDriverId } from "./drivers";
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
  driverId?: string;
  location: Location;
  duration?: number;
  priority?: OrderPriority;
  notes?: string;
  phone?: string;
  link?: string;
  customerName?: string;
  attachment?: string;
  timeTo?: string;
  timeFrom?: string;
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
      assignedTo: { serial: pickup.driverId || UnassignedDriverId },
      location: {
        ...sanitizeLocation(pickup.location),
        acceptPartialMatch: !pickup.location.latitude,
        acceptMultipleResults: !pickup.location.latitude,
      },
      timeWindows: [getTimeWindow(pickup)].filter((x) => x?.twFrom || x?.twTo),
      duration: (pickup.duration && +pickup.duration) || 5,
      priority: (pickup.priority || "Medium").substring(0, 1),
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
      assignedTo: {
        serial: delivery.driverId || pickup.driverId || UnassignedDriverId,
      },
      location: {
        ...sanitizeLocation(delivery.location),
        acceptPartialMatch: !delivery.location.latitude,
        acceptMultipleResults: !delivery.location.latitude,
      },
      timeWindows: [getTimeWindow(delivery)].filter(
        (x) => x?.twFrom || x?.twTo,
      ),
      duration: (delivery.duration && +delivery.duration) || 5,
      priority: (delivery.priority || pickup.priority || "Medium").substring(
        0,
        1,
      ),
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

interface TimeWindow {
  twFrom: string;
  twTo: string;
}

const getTimeWindow = (order: OptimoRouteOrder): TimeWindow | null =>
  order?.timeFrom || order?.timeTo
    ? {
        twFrom: validatedTime(order?.timeFrom?.trim() || "00:00"),
        twTo: validatedTime(order?.timeTo?.trim() || "23:59"),
      }
    : null;

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

const validatedTime = (time: string): string => {
  if (!/[0-2][0-9]:[0-5][0-9]/.test(time)) {
    throw Error(
      `Invalid time window: ${time} - must be in 24-hour (##:##) format`,
    );
  }

  return time;
};
