import { BehaviorSubject, Observable } from "rxjs";
import { filter, switchMap, tap } from "rxjs/operators";
import { authState, user } from "rxfire/auth";
import { collectionData, docData } from "rxfire/firestore";

import { ICart } from "./cart";
import { IAddress, IUser } from "./types";
import { Api } from "./utils";
import { CONFIG, firebase } from "./core";

class AuthModule {
  /** */
  auth: { uid: String };

  /** */
  authState$: Observable<any>;

  private readonly _user = new BehaviorSubject<IUser>(null);
  public readonly user$ = this._user.asObservable();

  get user(): IUser {
    return this._user.getValue();
  }

  set user(val: IUser) {
    if (!val) {
      this.createUser();
    } else {
      this._user.next(val);
    }
  }

  async createUser() {
    await this.updateFromAuth(this.auth);
  }

  createCustomToken(tokenId) {
    return Api.post(`${CONFIG.shop.apiURL}/auth/createCustomToken`, {
      token: tokenId,
    });
  }

  setAuth(auth) {
    return firebase.auth().signInWithCustomToken(auth);
  }

  /**
   *
   */
  bootstrap() {
    this.authState$ = authState(firebase.auth());

    this.authState$
      .pipe(
        tap((auth) => (this.auth = auth)),
        filter((auth) => auth !== null),
        switchMap((auth) =>
          docData(
            firebase
              .firestore()
              .collection("shops")
              .doc(CONFIG.shop.$key)
              .collection("customers")
              .doc(auth.uid),
          ),
        ),
      )
      .subscribe(async (val: IUser) => {
        if (!val.uid) {
          return await this.loginAnonymously();
        }
        this.user = val;
        Api.token = await firebase.auth().currentUser.getIdToken();
      });
  }

  /**
   *
   */
  async logout() {
    await firebase.auth().signOut();
    // return this.loginAnonymously();
  }

  /**
   *
   * @param address
   */
  async addAddress(address: IAddress) {
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
      .doc(Auth.user.uid as string)
      .update({ addresses });
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
      .where("customer.uid", "==", Auth.user.uid as string);
    return collectionData(ordersRef, "$key");
  }

  /**
   *
   * @param data
   */
  async login(data) {
    const { token } = await Api.post(
      `${CONFIG.shop.apiURL}/auth/authenticate`,
      {
        ...data,
      },
    );
    await firebase.auth().signInWithCustomToken(token);
    // return this.updateFromAuth(this.auth);
  }

  /**
   *
   * @param data
   */
  async register(data: { email: String; password: String; name: String }) {
    // if there is no user we login anonymously
    if (!this.user) {
      await this.loginAnonymously();
    }

    // if user is anonymous we create a new account for them
    if (this.user.isAnonymous) {
      const { token } = await Api.post(`${CONFIG.shop.apiURL}/auth/register`, {
        ...data,
        uid: this.user.uid,
      });

      await firebase.auth().signInWithCustomToken(token);

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
  }

  /**
   *
   * @param email
   */
  async checkUserExist(email: String) {
    return Api.post(`${CONFIG.shop.apiURL}/auth/checkUserExist`, { email });
  }

  /**
   *
   * @param changes
   */
  async update(changes) {
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
      await Promise.all(updates);
      // return this.updateFromAuth(this.auth);
    } catch (error) {
      // if this fails huh sucks for you
      console.log(error);
    }
  }

  /**
   *
   * @param auth
   */
  private async updateFromAuth(auth) {
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
  async loginAnonymously() {
    const { user } = await firebase.auth().signInAnonymously();
    console.log(user);
    return firebase
      .firestore()
      .collection("shops")
      .doc(CONFIG.shop.$key)
      .collection("customers")
      .doc(user.uid)
      .set({ isAnonymous: true, uid: user.uid, addresses: [] });
  }
}

export const Auth = new AuthModule();
