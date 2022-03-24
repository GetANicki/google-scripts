import { Customer } from "../shared/types";
import { getAll } from "./stripe";

export const getCustomers = (): Customer[] =>
  getAll("/customers", { limit: 100 }).sort((x, y) =>
    x.displayName! > y.displayName! ? 1 : -1,
  );
