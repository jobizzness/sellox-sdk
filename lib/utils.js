import { __awaiter } from "tslib";
import { CONFIG } from "./core";
export const Api = {
    token: "",
    post(url = "", data = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // Default options are marked with *
            const res = yield fetch(url, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${this.token}`,
                    $shopKey: CONFIG.shop.$key,
                },
                redirect: "follow",
                referrer: "no-referrer",
                body: JSON.stringify(Object.assign(Object.assign({}, data), { $shopKey: CONFIG.shop.$key })),
            });
            if (!res.ok) {
                throw new Error("Network response was not ok.");
            }
            return res.json();
        });
    },
};
export default Api;
//# sourceMappingURL=utils.js.map