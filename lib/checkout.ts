import * as firebase from 'firebase/app';

import { Api } from './utils';
import { IPaymentMethod } from './types';
import { ICart, ICartItem } from './cart';
import { Auth } from './auth';
import { shippingDestination } from './shop';
import { CONFIG } from './core';

export enum CHECKOUT_MODES {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY'
}
export class CheckoutModule {
  stripe: {
    apiKey: string;
    country: string;
    currency: string;
    shippingOptions: Array<Object>;
  };
  paymentMethods: Array<IPaymentMethod>;

  /**
   *
   * @param config
   */
  bootstrap(config) {
    this.stripe = {
      apiKey: config.apiKey,
      country: config.country,
      currency: config.currency,
      shippingOptions: config.shippingOptions
    };
  }

  /**
   *
   */
  canShipToAddress(): Boolean {
    return false;
  }

  /**
   *
   * @param data
   * @param address
   */
  calculateShipping(data: ICart, address): number {
    let total: number = 0;

    data.items.forEach((item: any) => {
      const {
        product: { shippingDetails }
      } = item;

      if (shippingDetails.destinations.length === 0) {
        throw new Error('No destinations found');
      }

      // try to find the destination
      let countryToShip = shippingDetails.destinations.find(
        destination => destination.country.value === address.country
      );

      // if not found try to use international
      if (!countryToShip) {
        countryToShip = shippingDetails.destinations.find(
          destination => destination.country.value === 'international'
        );
      }

      // we wont ship to international anyway
      if (!countryToShip) {
        throw new Error('we dont ship to this location');
      }

      total =
        Number.parseFloat(countryToShip.price) *
        Number.parseFloat(shippingDetails.weight) *
        item.quantity;
    });

    return total;
  }

  getTotal(cart, options) {
    const total =
      this.calculateShipping(cart, options.shippingAddress) + cart.total;
    return total * 100;
  }

  /**
   *
   * @param cart
   */
  getSubTotal(cart) {
    return (cart.total as number) * 100;
  }

  async createCheckout(data: ICart, options) {
    const checkout = {
      mode: options.mode || 'DELIVERY',
      customer: Auth.user,
      shippingAddress: options.shippingAddress,
      uid: Auth.user.uid,
      items: data.items,
      quantity: data.quantity,
      subTotal: this.getSubTotal(data),
      shippingCost: this.calculateShipping(data, options.shippingAddress),
      total: this.getTotal(data, options)
    };
    return await firebase
      .firestore()
      .collection('shops')
      .doc(CONFIG.shop.$key)
      .collection('checkout')
      .add(checkout);
  }

  /**
   *
   * @param data
   */
  async createIntent(data: ICart, options) {
    const checkout = {
      mode: 'DELIVERY',
      customer: Auth.user,
      shippingAddress: options.shippingAddress,
      uid: Auth.user.uid,
      items: data.items,
      quantity: data.quantity,
      subTotal: this.getSubTotal(data),
      shippingCost: this.calculateShipping(data, options.shippingAddress),
      total: this.getTotal(data, options)
    };
    const ref = await firebase
      .firestore()
      .collection('shops')
      .doc(CONFIG.shop.$key)
      .collection('checkout')
      .add(checkout);
    const intent = await Api.post(
      `${CONFIG.shop.apiURL}/payment/stripe-intent`,
      {
        $key: ref.id
      }
    );

    return { intent, checkout };
  }

  async cashCheckout() {}
}

export const Checkout = new CheckoutModule();
