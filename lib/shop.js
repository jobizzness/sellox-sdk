import * as firebase from 'firebase/app';
import { collectionData, docData } from 'rxfire/firestore';
import { CONFIG } from './core';
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
    latest(number) {
        const productsRef = firebase
            .firestore()
            .collection('shops')
            .doc(CONFIG.shop.$key)
            .collection('products');
        return collectionData(productsRef, '$key');
    }
}();
//# sourceMappingURL=shop.js.map