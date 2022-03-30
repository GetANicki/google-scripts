import { getRoutes } from "../../services/optimoroute";
import {
  assignDriversToOrders,
  getOrders,
  OrderDriver,
} from "../../services/orders";

export const updateOrderDrivers = () => {
  const ordersWithoutDrivers = getOrders().filter(
    (x) => !x.nicki && !!x.pickupDate,
  );

  const orderDates = [
    ...new Set(ordersWithoutDrivers.map((x) => x.pickupDate as Date)),
  ];

  for (const date of orderDates) {
    console.log(`Getting drivers for ${date}...`);

    const orderDrivers = getRoutes(date).routes.flatMap(
      ({ driverSerial, stops }) =>
        stops.map(({ orderNo }) => ({ orderNo, driverSerial } as OrderDriver)),
    );

    assignDriversToOrders(orderDrivers);
    console.log(`Drivers updated for ${date}.`);
  }
};
