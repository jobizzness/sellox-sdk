import { collectionData, docData } from "rxfire/firestore";
import { map } from "rxjs/operators";
import { CONFIG, firebase } from "./core";
import { BehaviorSubject, combineLatest } from "rxjs";
export const Shop = new (class {
    constructor() {
        this.filters$ = new BehaviorSubject({ category: null });
    }
    getShop(username) {
        return firebase
            .firestore()
            .collection("shops")
            .orderBy("createdAt")
            .where("username", "==", username)
            .limit(1)
            .get();
    }
    filterProducts(filters) {
        this.filters$.next(filters);
    }
    /**
     *
     * @param slug
     */
    find(slug) {
        const productRef = firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("products")
            .doc(slug);
        return docData(productRef, "$key");
    }
    getCategories() {
        const ref = firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("categories");
        return collectionData(ref, "$key");
    }
    /**
     *
     */
    products() {
        return this;
    }
    getCurrency() {
        return (this.data && this.data.currency) || { symbol: "$", value: "USD" };
    }
    /**
     *
     * @param number
     */
    latest(number) {
        const productsRef = firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("products")
            .where("isPublished", "==", true);
        return collectionData(productsRef, "$key");
    }
    getTopProducts($key) {
        const productsRef = firebase
            .firestore()
            .collection("shops")
            .doc($key)
            .collection("products")
            .where("isPublished", "==", true)
            .limit(20);
        return collectionData(productsRef, "$key");
    }
    getProducts() {
        this.products$ = this.products$ || this.products().latest(100);
        const stream$ = combineLatest([this.products$, this.filters$]);
        return stream$.pipe(map(([products, filters]) => {
            return products.map((item) => {
                const categoryTerm = filters.category;
                const found = item.categories.findIndex((element) => {
                    return element.value.toLowerCase() === categoryTerm;
                }) !== -1;
                if (categoryTerm && !found) {
                    return false;
                }
                return item;
            });
        }));
    }
    getHasCategory(category, limit = 10) {
        const productsRef = firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("products")
            .where("isPublished", "==", true)
            .limit(20);
        return collectionData(productsRef, "$key");
    }
    trackProductView({ $key, $shopkey, uid }) {
        return firebase
            .firestore()
            .collection("shops")
            .doc($shopkey)
            .collection("products")
            .doc($key)
            .collection("views")
            .add({
            time: new Date().toString(),
            uid,
        });
    }
    trackShopView({ $key, uid }) {
        return firebase
            .firestore()
            .collection("shops")
            .doc($key)
            .collection("views")
            .add({
            time: new Date().toString(),
            uid,
        });
    }
})();
//# sourceMappingURL=shop.js.map