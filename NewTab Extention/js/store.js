/* chrome.storage.local wrapper + shared state defaults */

const PERSIST_KEY = 'ib_newtab_v3';

export const DEFAULTS = {
  // Core
  name: '',
  engine: 'google',
  theme: 'dark',
  accent: '#185adb',
  layout: 'scroll',
  showGrid: true,
  showCrypto: true,
  coins: 'bitcoin,ethereum,tether,binancecoin,ripple',
  tipIndex: 0,

  // Feature 1: Watchlist
  watchlist: [],

  // Feature 2: Content Feed
  feedCategories: ['crypto', 'broker', 'fraud'],
  feedCache: null,

  // Feature 5: Iran Market
  iranRatesCache: null,

  // Feature 6: Economic Calendar
  calendarCache: null,

  // Feature 8: Broker Radar
  selectedBroker: null,

  // Feature 9: Quick Note
  quickNote: '',

  // Feature 10: Session Timer
  sessionConfig: null,
};

function chromeGet(cb) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(PERSIST_KEY, result => {
        cb(result[PERSIST_KEY] || {});
      });
    } else {
      cb(JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}'));
    }
  } catch (e) {
    cb({});
  }
}

function chromeSet(data) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [PERSIST_KEY]: data });
    } else {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
    }
  } catch (e) {}
}

export const store = {
  _state: null,

  load() {
    return new Promise(resolve => {
      chromeGet(saved => {
        this._state = Object.assign({}, DEFAULTS);
        Object.keys(DEFAULTS).forEach(k => {
          if (saved[k] !== undefined) this._state[k] = saved[k];
        });
        resolve(this._state);
      });
    });
  },

  get() {
    return this._state || Object.assign({}, DEFAULTS);
  },

  set(patch) {
    Object.assign(this._state, patch);
    chromeSet(this._state);
  },

  save() {
    chromeSet(this._state);
  }
};
