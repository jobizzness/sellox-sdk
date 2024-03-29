import { __awaiter } from "tslib";
import { BehaviorSubject } from "rxjs";
import { Auth } from "./auth";
import { CONFIG, firebase } from "./core";
export const EMPTY_CART = {
    items: [],
    quantity: 0,
    total: 0,
};
export const Cart = new (class {
    constructor() {
        this.items = [];
        this.quantity = 0;
        this.total = 0;
        this._cart = new BehaviorSubject({
            items: this.items,
            quantity: this.quantity,
            total: this.total,
        });
        this.data$ = this._cart.asObservable();
        this.calculateDiscountAmount = (discount, price) => {
            var _a, _b;
            if (((_a = discount.discountType) === null || _a === void 0 ? void 0 : _a.value) === "PERCENTAGE") {
                return price * (Number.parseFloat(discount.amount) / 100);
            }
            else if (((_b = discount.discountType) === null || _b === void 0 ? void 0 : _b.value) === "AMOUNT_OFF") {
                return Number.parseFloat(discount.amount);
            }
            return 0;
        };
    }
    bootstrap() {
        Auth.user$.subscribe((user) => {
            if (user) {
                this.data = user.cart;
            }
            else {
                this.data = Object.assign({}, EMPTY_CART);
            }
        });
    }
    get data() {
        return {
            items: this.items,
            quantity: this.quantity,
            total: this.total,
        };
    }
    set data(val) {
        if (!val)
            return;
        this.items = val.items;
        this.quantity = val.quantity;
        this.total = val.total;
        this._cart.next(val);
    }
    /**
     *
     * @param item
     */
    add(item) {
        return __awaiter(this, void 0, void 0, function* () {
            this.guard();
            // Update item quantity or add to cart
            this.hasItem(item) ? this._incrementQuantity(item) : this.items.push(item);
            this.compute();
            return yield this.update(this.data);
        });
    }
    /**
     *
     * @param item
     */
    updateQuantity(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const i = this.indexOf(item);
            if (i === -1) {
                throw new Error("item is not in cart");
            }
            if (item.quantity == 0) {
                // you got to go
                this.items.splice(i, 1);
            }
            else {
                this.items[i].quantity = item.quantity;
            }
            this.compute();
            yield this.update(this.data);
        });
    }
    /**
     *
     * @param item
     */
    hasItem(item) {
        return this.indexOf(item) !== -1;
    }
    /**
     *
     * @param item
     */
    _incrementQuantity(item) {
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
    indexOf(item) {
        // if item has varint key?
        // we match that too
        return this.items.findIndex((cartItem) => {
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
    remove(item) {
        return __awaiter(this, void 0, void 0, function* () {
            this.guard();
            const index = this.indexOf(item);
            this.items = this.items.filter((element, key) => key !== index);
            this.compute();
            return yield this.update(this.data);
        });
    }
    /**
     *
     * @param items
     */
    computeQuantity(items) {
        return items.length;
    }
    /**
     *
     * @param items
     */
    computeTotal(items) {
        let total = 0;
        items.forEach((item) => {
            if (item.variant$key) {
                let i = item.product.variants.findIndex((variant) => variant.value == item.variant$key);
                let variantPrice = i !== -1 && item.product.variants[i].price;
                // If user did not set a stock
                item.price = !variantPrice ? item.price : variantPrice;
            }
            total =
                total + Number.parseFloat(item.price) * Number.parseInt(item.quantity);
        });
        return total.toFixed(2);
    }
    // foreach of my cart items, calculate the discount
    applyDiscount(code, cart) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield firebase
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
            const discount = res.docs[0].data();
            // applu the discount to all cart items
            let amount = this.calculateDiscountAmount(discount, Number.parseFloat(cart.total));
            return {
                discount,
                $code: code,
                amount,
            };
        });
    }
    compute() {
        this.quantity = this.computeQuantity(this.items);
        this.total = this.computeTotal(this.items);
    }
    /**
     *
     */
    update(cart) {
        return __awaiter(this, void 0, void 0, function* () {
            return firebase
                .firestore()
                .collection("shops")
                .doc(CONFIG.shop.$key)
                .collection("customers")
                .doc(Auth.auth.uid)
                .update({ cart });
        });
    }
    /**
     *
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            this.guard();
            yield this.update(Object.assign({}, EMPTY_CART));
        });
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
//# sourceMappingURL=cart.js.map