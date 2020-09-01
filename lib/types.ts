import { ICart } from "./cart";

export interface IAddress {}

export interface IUser {
  isAnonymous: Boolean;
  name?: string;
  uid: String;
  cart: ICart;
  addresses: Array<any>;
  carts: any;
  locale?: any;
}

export interface IPaymentMethod {
  name: "CARD" | "GOOGLE_PAY" | "APPLE_PAY";
}
