import { collectionData, docData } from "rxfire/firestore";
import { BehaviorSubject } from "rxjs";

import { Auth } from "./auth";
import { IProduct } from "./shop";
import { IUser } from "./types";
import { CONFIG, firebase } from "./core";

export interface ICart {
  items: Array<any>;
  quantity: Number;
  total: Number | string;
}

export interface ICartItem {
  quantity: Number;
  price: Number | String;
  product: IProduct;
  $key: String;
  variant$key?: String;
}

export const EMPTY_CART: ICart = {
  items: [],
  quantity: 0,
  total: 0,
};
export const Cart = new (class {
  items: Array<any> = [];
  quantity: Number = 0;
  total: Number | string = 0;

  private readonly _cart = new BehaviorSubject<ICart>({
    items: this.items,
    quantity: this.quantity,
    total: this.total,
  });

  readonly data$ = this._cart.asObservable();

  bootstrap() {
    Auth.user$.subscribe((user: IUser) => {
      if (user) {
        this.data = user.cart;
      } else {
        this.data = { ...EMPTY_CART };
      }
    });
  }

  get data(): ICart {
    return {
      items: this.items,
      quantity: this.quantity,
      total: this.total,
    };
  }

  set data(val: ICart) {
    if (!val) return;
    this.items = val.items;
    this.quantity = val.quantity;
    this.total = val.total;
    this._cart.next(val);
  }

  /**
   *
   * @param item
   */
  async add(item: ICartItem) {
    this.guard();

    // Update item quantity or add to cart
    this.hasItem(item) ? this._incrementQuantity(item) : this.items.push(item);

    this.compute();
    return await this.update(this.data);
  }

  /**
   *
   * @param item
   */
  async updateQuantity(item: ICartItem) {
    const i = this.indexOf(item);
    if (i === -1) {
      throw new Error("item is not in cart");
    }

    if (item.quantity == 0) {
      // you got to go
      this.items.splice(i, 1);
    } else {
      this.items[i].quantity = item.quantity;
    }
    this.compute();
    await this.update(this.data);
  }

  /**
   *
   * @param item
   */
  private hasItem(item: ICartItem) {
    return this.indexOf(item) !== -1;
  }

  /**
   *
   * @param item
   */
  private _incrementQuantity(item: ICartItem) {
    const i = this.indexOf(item);
    if (i === -1) {
      throw new Error("item is not in cart");
    }

    let currentItem = this.items[i];
    currentItem.quantity = item.quantity + currentItem.quantity;
  }

  /**
   *
   * @param item
   */
  private indexOf(item: ICartItem) {
    // if item has varint key?
    // we match that too
    return this.items.findIndex((cartItem: ICartItem) => {
      return item.variant$key
        ? cartItem.variant$key === item.variant$key &&
            item.$key === cartItem.$key
        : item.$key === cartItem.$key;
    });
  }

  /**
   *
   * @param item
   */
  async remove(item: ICartItem) {
    this.guard();

    const index = this.indexOf(item);
    this.items = this.items.filter((element, key) => key !== index);
    this.compute();
    return await this.update(this.data);
  }

  /**
   *
   * @param items
   */
  private computeQuantity(items) {
    return items.length;
  }

  /**
   *
   * @param items
   */
  computeTotal(items: Array<ICartItem>): string {
    let total: number = 0;

    items.forEach((item: any) => {
      if (item.variant$key) {
        let i = item.product.variants.findIndex(
          (variant) => variant.value == item.variant$key,
        );
        let variantPrice = i !== -1 && item.product.variants[i].price;
        // If user did not set a stock

        item.price = !variantPrice ? item.price : variantPrice;
      }
      total =
        total + Number.parseFloat(item.price) * Number.parseInt(item.quantity);
    });

    return total.toFixed(2);
  }

  calculateDiscountAmount = (discount, price: number) => {
    if (discount.discountType?.value === "PERCENTAGE") {
      return price * (Number.parseFloat(discount.amount) / 100);
    } else if (discount.discountType?.value === "AMOUNT_OFF") {
      return Number.parseFloat(discount.amount);
    }

    return 0;
  };

  // foreach of my cart items, calculate the discount

  async applyDiscount(code, cart) {
    const res = await firebase
      .firestore()
      .collection("shops")
      .doc(CONFIG.shop.$key)
      .collection("discounts")
      .where("$code", "==", code && code.toUpperCase())
      .limit(1)
      .get();

    if (res.docs.length === 0) {
      throw new Error("unknown Code");
    }

    const discount = res.docs[0];

    // applu the discount to all cart items
    let amount = this.calculateDiscountAmount(
      discount,
      Number.parseFloat(cart.total),
    );

    return {
      discount,
      $code: code,
      amount,
    };
  }

  private compute() {
    this.quantity = this.computeQuantity(this.items);
    this.total = this.computeTotal(this.items);
  }

  /**
   *
   */
  async update(cart: ICart) {
    return firebase
      .firestore()
      .collection("shops")
      .doc(CONFIG.shop.$key)
      .collection("customers")
      .doc(Auth.auth.uid as string)
      .update({ cart });
  }

  /**
   *
   */
  async clear() {
    this.guard();
    await this.update({ ...EMPTY_CART });
  }

  /**
   *
   */
  guard() {
    if (!Auth.auth) {
      throw new Error("please login before performing this action");
    }
  }
})();
