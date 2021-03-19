import { __awaiter } from "tslib";
import { BehaviorSubject } from "rxjs";
import { filter, switchMap, tap } from "rxjs/operators";
import { authState } from "rxfire/auth";
import { collectionData, docData } from "rxfire/firestore";
import { Api } from "./utils";
import { CONFIG, firebase } from "./core";
class AuthModule {
    constructor() {
        this._user = new BehaviorSubject(null);
        this.user$ = this._user.asObservable();
    }
    get user() {
        return this._user.getValue();
    }
    set user(val) {
        if (!val) {
            this.createUser();
        }
        else {
            this._user.next(val);
        }
    }
    createUser() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateFromAuth(this.auth);
        });
    }
    /**
     *
     */
    bootstrap() {
        this.authState$ = authState(firebase.auth());
        this.authState$
            .pipe(tap((auth) => (this.auth = auth)), filter((auth) => auth !== null), switchMap((auth) => docData(firebase.firestore().collection("shops")
            .doc(CONFIG.shop.$key).collection("customers").doc(auth.uid))))
            .subscribe((val) => __awaiter(this, void 0, void 0, function* () {
            if (!val.uid) {
                return yield this.loginAnonymously();
            }
            this.user = val;
            Api.token = yield firebase.auth().currentUser.getIdToken();
        }));
    }
    /**
     *
     */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield firebase.auth().signOut();
            return this.loginAnonymously();
        });
    }
    /**
     *
     * @param address
     */
    addAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Auth.user) {
                throw new Error("user is not authenticated");
            }
            const addresses = Auth.user.addresses;
            addresses.push(address);
            return firebase
                .firestore()
                .collection("shops")
                .doc(CONFIG.shop.$key)
                .collection("customers")
                .doc(Auth.user.uid)
                .update({ addresses });
        });
    }
    /**
     *
     */
    getOrders() {
        const ordersRef = firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("orders")
            .where("customer.uid", "==", Auth.user.uid);
        return collectionData(ordersRef, "$key");
    }
    /**
     *
     * @param data
     */
    login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = yield Api.post(`${CONFIG.shop.apiURL}/auth/authenticate`, Object.assign({}, data));
            yield firebase.auth().signInWithCustomToken(token);
            // return this.updateFromAuth(this.auth);
        });
    }
    /**
     *
     * @param data
     */
    register(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // if there is no user we login anonymously
            if (!this.user) {
                yield this.loginAnonymously();
            }
            // if user is anonymous we create a new account for them
            if (this.user.isAnonymous) {
                const { token } = yield Api.post(`${CONFIG.shop.apiURL}/auth/register`, Object.assign(Object.assign({}, data), { uid: this.user.uid }));
                yield firebase.auth().signInWithCustomToken(token);
                // post()
                // (Anonymous user is signed in at that point.)
                // 1. Create the email and password credential, to upgrade the
                // anonymous user.
                // var credential = firebase.auth.EmailAuthProvider.credential(
                //   data.email.toLowerCase(),
                //   data.password as string
                // );
                // 2. Links the credential to the currently signed in user
                // (the anonymous user).
                // await firebase.auth().currentUser.linkWithCredential(credential);
                // await firebase
                //   .auth()
                //   .currentUser.updateProfile({ displayName: data.name as string });
                // return this.updateFromAuth(this.auth);
            }
        });
    }
    /**
     *
     * @param email
     */
    checkUserExist(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return Api.post(`${CONFIG.shop.apiURL}/auth/checkUserExist`, { email });
        });
    }
    /**
     *
     * @param changes
     */
    update(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.auth) {
                throw new Error("user is not logged it for this action");
            }
            const updates = [];
            const user = firebase.auth().currentUser;
            // if (changes.password) {
            //   // updates.push(user.updatePassword(changes.password));
            // }
            // if (changes.email) {
            //   updates.push(user.updateEmail(changes.email.toLowerCase()));
            // }
            // if (changes.phone) {
            //   updates.push(user.updatePhoneNumber(changes.phone));
            // }
            // if (changes.name) {
            //   updates.push(user.updateProfile({ displayName: changes.name }));
            // }
            try {
                yield Promise.all(updates);
                // return this.updateFromAuth(this.auth);
            }
            catch (error) {
                // if this fails huh sucks for you
                console.log(error);
            }
        });
    }
    /**
     *
     * @param auth
     */
    updateFromAuth(auth) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!auth) {
                throw new Error("whoops! no auth to update");
            }
            return firebase
                .firestore()
                .collection("shops")
                .doc(CONFIG.shop.$key)
                .collection("customers")
                .doc(auth.uid)
                .update({
                isAnonymous: auth.isAnonymous,
                uid: auth.uid,
                name: auth.displayName,
                avatar: auth.photoURL,
                phone: auth.phoneNumber || null,
                email: auth.email || null,
            });
        });
    }
    /**
     *
     * @param email
     */
    addGuestEmail(email) {
        const user = firebase.auth().currentUser;
        return firebase
            .firestore()
            .collection("shops")
            .doc(CONFIG.shop.$key)
            .collection("customers")
            .doc(user.uid)
            .update({ email });
    }
    /**
     * @return Promise
     */
    loginAnonymously() {
        return __awaiter(this, void 0, void 0, function* () {
            const { user } = yield firebase.auth().signInAnonymously();
            console.log(user);
            return firebase
                .firestore().collection("shops")
                .doc(CONFIG.shop.$key)
                .collection("customers")
                .doc(user.uid)
                .set({ isAnonymous: true, uid: user.uid, addresses: [] });
        });
    }
}
export const Auth = new AuthModule();
//# sourceMappingURL=auth.js.map