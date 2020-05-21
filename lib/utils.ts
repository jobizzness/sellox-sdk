import { CONFIG } from './core';

export const Api = {
  token: '',

  async post(url = '', data = {}) {
    // Default options are marked with *
    const res = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${this.token}`,
        $shopKey: CONFIG.shop.$key
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrer: 'no-referrer', // no-referrer, *client
      body: JSON.stringify({ ...data, $shopKey: CONFIG.shop.$key }) // body data type must match "Content-Type" header
    });

    if (!res.ok) {
      throw new Error('Network response was not ok.');
    }
    return res.json();
  }
};

export default Api;
