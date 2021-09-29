import { __awaiter } from "tslib";
import { Api } from "./utils";
import { Auth } from "./auth";
import { CONFIG, firebase } from "./core";
import { Shop } from "./shop";
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
            shippingOptions: config.shippingOptions,
        };
    }
    /**
     *
     */
    canShipToAddress() {
        return false;
    }
    getCurrentZone(zones, { originCountry, address }) {
        const zone = originCountry === address.country ? "DOMESTIC" : "INTERNATIONAL";
        const i = zones.findIndex((item) => item.value === zone);
        if (i === -1) {
            throw new Error("No shipping zone found");
        }
        return zones[i];
    }
    getAvailableRates(address) {
        const shop = Shop.data;
        const originCountry = shop.country && shop.country.value;
        const shipping = shop.settings.shipping;
        if (!originCountry) {
            // we got issues
            throw new Error("Shop does not have an origin country");
        }
        if (shipping.zones.length < 1) {
            // we got issues
            throw new Error("Shop does not have any zones");
        }
        const currentZone = this.getCurrentZone(shipping.zones, {
            originCountry,
            address,
        });
        return currentZone;
    }
    getWeight(data) {
        let weight = 0;
        data.items.forEach((item) => {
            weight += item.product.shippingDetails.weight;
        });
        return weight;
    }
    find($key) {
        const ref = firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("checkout")
            .doc($key);
        return ref.get();
    }
    updatePhone(checkoutRef, phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return firebase
                .firestore()
                .collection('shops')
                .doc(CONFIG.shop.$key)
                .collection('checkout')
                .doc(checkoutRef.$key)
                .update({ 'shippingAddress.phoneNumber': phone });
        });
    }
    checkRateApplies(rate, data) {
        // ok you have given me a rate and some cart data.
        let rateApplies = false;
        let fee = 0;
        // what is the charge algorithm?
        // if none, we wont proceed
        const chargeAlgorithm = rate.chargeAlgorithm && rate.chargeAlgorithm.value;
        if (chargeAlgorithm === "FLAT_RATE") {
            // Charge flat rate price
            // result.willApply
            fee = rate.price;
            rateApplies = true;
        }
        else if (chargeAlgorithm === "WEIGHT") {
            // check each item in the card and calculate the weight
            const weight = this.getWeight(data);
            if (weight < rate.minWeight || weight > rate.maxWeight) {
                rateApplies = false;
            }
            else {
                fee = 0;
                rateApplies = true;
                data.items.forEach((item) => {
                    // Charge weight price
                    fee +=
                        Number.parseFloat(rate.price) *
                            Number.parseFloat(item.product.shippingDetails.weight) +
                            (item.quantity - 1 * rate.pricePerAdditional);
                });
            }
        }
        if (rate.offersFreeShipping && rate.minFreeOrderAmount) {
            //if has free shipping and qualified then apply that and we done
            // check qualification and then apply
            fee = Number(data.total) > rate.minFreeOrderAmount ? 0 : fee;
        }
        return Object.assign(Object.assign({}, rate), { rateApplies, fee });
    }
    /**
     *
     * @param data
     * @param address
     */
    calculateShipping(data, address) {
        let total = 0;
        if (address.rate) {
            return address.rate.fee;
        }
        return total;
    }
    getTotal(cart, options) {
        const total = Number(this.calculateShipping(cart, options.shippingAddress)) +
            Number.parseFloat(cart.total);
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
                mode: options.mode || "DELIVERY",
                customer: Auth.user,
                shippingAddress: options.shippingAddress,
                uid: Auth.user.uid,
                items: data.items,
                quantity: data.quantity,
                subTotal: this.getSubTotal(data),
                shippingCost: this.calculateShipping(data, options.shippingAddress),
                total: this.getTotal(data, options),
            };
            return yield firebase
                .firestore()
                .collection("shops")
                .doc(CONFIG.shop.$key)
                .collection("checkout")
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
                mode: "DELIVERY",
                customer: Auth.user,
                shippingAddress: options.shippingAddress,
                uid: Auth.user.uid,
                items: data.items,
                quantity: data.quantity,
                subTotal: this.getSubTotal(data),
                shippingCost: this.calculateShipping(data, options.shippingAddress),
                total: this.getTotal(data, options),
            };
            const ref = yield firebase
                .firestore()
                .collection("shops")
                .doc(CONFIG.shop.$key)
                .collection("checkout")
                .add(checkout);
            const intent = yield Api.post(`${CONFIG.shop.apiURL}/payment/stripe-intent`, {
                $key: ref.id,
            });
            return { intent, checkout };
        });
    }
    stripeIntentFromCheckout(checkout) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Api.post(`${CONFIG.shop.apiURL}/payment/stripe-intent`, {
                $key: checkout.id,
            });
        });
    }
    ipay88IntentFromCheckout(checkout) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Api.post(`${CONFIG.shop.apiURL}/payment/ipay88-intent`, {
                $key: checkout.id,
            });
        });
    }
    cashCheckout($key) {
        return __awaiter(this, void 0, void 0, function* () {
            const intent = yield Api.post(`${CONFIG.shop.apiURL}/payment/custom`, {
                $key: $key,
            });
        });
    }
}
export const Checkout = new CheckoutModule();
//# sourceMappingURL=checkout.js.map