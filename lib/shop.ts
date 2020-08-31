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

export const Shop = new (class {
  data;

  getShop(username) {
    return firebase
      .firestore()
      .collection('shops')
      .orderBy('createdAt')
      .where('username', '==', username)
      .limit(1)
      .get();
  }
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

  getCategories() {
    const ref = firebase
      .firestore()
      .collection('shops')
      .doc(CONFIG.shop.$key)
      .collection('categories');
    return collectionData(ref, '$key');
  }

  /**
   *
   */
  products() {
    return this;
  }

  getCurrency() {
    return (this.data && this.data.currency) || { symbol: '$', value: 'USD' };
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
      .collection('products')
      .where('isPublished', '==', true);
    return collectionData(productsRef, '$key');
  }

  getTopProducts($key) {
    const productsRef = firebase
      .firestore()
      .collection('shops')
      .doc($key)
      .collection('products')
      .where('isPublished', '==', true)
      .limit(20);
    return collectionData(productsRef, '$key');
  }

  getHasCategory(category, limit = 10) {
    const productsRef = firebase
      .firestore()
      .collection('shops')
      .doc(CONFIG.shop.$key)
      .collection('products')
      .where('isPublished', '==', true)
      .limit(20);
    return collectionData(productsRef, '$key');
  }

  trackProductView({ $key, $shopkey, uid }) {
    return firebase
      .firestore()
      .collection('shops')
      .doc($shopkey)
      .collection('products')
      .doc($key)
      .collection('views')
      .add({
        time: new Date().toString(),
        uid
      });
  }

  trackShopView({ $key, uid }) {
    return firebase
      .firestore()
      .collection('shops')
      .doc($key)
      .collection('views')
      .add({
        time: new Date().toString(),
        uid
      });
  }
})();
