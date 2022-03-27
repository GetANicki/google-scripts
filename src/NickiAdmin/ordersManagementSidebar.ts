import { getCustomers } from "../services/customers";
import { Customer } from "../shared/types";

export class OrderManagementViewModel {
  private _customers: Customer[] = [];

  get customers() {
    return this._customers;
  }

  init() {
    this._customers = getCustomers();
  }

  closeSidebar() {
    console.log("Closed sidebar");
  }
}
