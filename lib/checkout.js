import { __awaiter } from "tslib";
import * as firebase from 'firebase/app';
import { Api } from './utils';
import { Auth } from './auth';
import { CONFIG } from './core';
export var CHECKOUT_MODES;
(function (CHECKOUT_MODES) {
    CHECKOUT_MODES["PICKUP"] = "PICKUP";
    CHECKOUT_MODES["DELIVERY"] = "DELIVERY";
})(CHECKOUT_MODES || (CHECKOUT_MODES = {}));
export class CheckoutModule {
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
    canShipToAddress() {
        return false;
    }
    /**
     *
     * @param data
     * @param address
     */
    calculateShipping(data, address) {
        let total = 0;
        data.items.forEach((item) => {
            const { product: { shippingDetails } } = item;
            if (shippingDetails.destinations.length === 0) {
                throw new Error('No destinations found');
            }
            // try to find the destination
            let countryToShip = shippingDetails.destinations.find(destination => destination.country.value === address.country);
            // if not found try to use international
            if (!countryToShip) {
                countryToShip = shippingDetails.destinations.find(destination => destination.country.value === 'international');
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
        const total = this.calculateShipping(cart, options.shippingAddress) + cart.total;
        return total * 100;
    }
    /**
     *
     * @param cart
     */
    getSubTotal(cart) {
        return cart.total * 100;
    }
    createCheckout(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
            return yield firebase
                .firestore()
                .collection('shops')
                .doc(CONFIG.shop.$key)
                .collection('checkout')
                .add(checkout);
        });
    }
    /**
     *
     * @param data
     */
    createIntent(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const ref = yield firebase
                .firestore()
                .collection('shops')
                .doc(CONFIG.shop.$key)
                .collection('checkout')
                .add(checkout);
            const intent = yield Api.post(`${CONFIG.shop.apiURL}/payment/stripe-intent`, {
                $key: ref.id
            });
            return { intent, checkout };
        });
    }
    cashCheckout() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
export const Checkout = new CheckoutModule();
//# sourceMappingURL=checkout.js.map