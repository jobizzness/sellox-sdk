import * as firebase from 'firebase/app';

import { collectionData, docData } from 'rxfire/firestore';
import { CONFIG } from './core';

export interface IProductMedia {
  downloadURL: String;
  path: String;
}

export interface shippingDestination {
  label: string;
  value: string;
  price: Number | string;
}
export interface IProduct {
  $key?: String;
  name: String;
  media: Array<IProductMedia>;
  stock: Number | String;
  variants?: any[];
  variantTypes?: any[];
  description: String;
  features: String;
  price: {
    value: Number | String;
    compare?: String;
  };
  shippingDetails: {
    destinations: Array<shippingDestination>;
    weight: String;
    weightUnit: String;
  };
}

export const Shop = new class {
  /**
   *
   * @param slug
   */
  find(slug) {
    const productRef = firebase
      .firestore()
      .collection('shops')
      .doc(CONFIG.shop.$key)
      .collection('products')
      .doc(slug);
    return docData(productRef, '$key');
  }

  /**
   *
   */
  products() {
    return this;
  }

  /**
   *
   * @param number
   */
  latest(number: Number) {
    const productsRef = firebase
      .firestore()
      .collection('shops')
      .doc(CONFIG.shop.$key)
      .collection('products');
    return collectionData(productsRef, '$key');
  }
}();
