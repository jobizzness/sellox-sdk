import * as firebase from "firebase/app";

export let CONFIG = {} as any;

export const Bootstrap = (config) => {
  CONFIG = config;
  firebase.initializeApp(config.firebaseConfig);
};

export const setConfig = (config) => {
  CONFIG = config;
};
