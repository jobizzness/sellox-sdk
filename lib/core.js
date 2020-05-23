import * as firebase from 'firebase/app';
export let CONFIG = {};
export const Bootstrap = config => {
    CONFIG = config;
    firebase.initializeApp(config.firebaseConfig);
};
//# sourceMappingURL=core.js.map