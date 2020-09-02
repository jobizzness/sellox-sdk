

export let CONFIG = {} as any;
export let firebase;

export const Bootstrap = (config, _firebase) => {
  CONFIG = config;
  firebase = _firebase
  firebase.initializeApp(config.firebaseConfig);
};

export const setConfig = (config) => {
  CONFIG = config;
};


