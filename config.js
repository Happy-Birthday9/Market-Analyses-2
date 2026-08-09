/* =========================================================
   AI MARKET ANALYZER
   config.js
========================================================= */

"use strict";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Never put a private/secret API key in frontend JavaScript.
| Anything inside config.js can be viewed by website visitors.
|
| For now, keep the key empty.
| Later, connect your secure backend/API proxy here.
|
*/

const CONFIG = {

  APP_NAME: "AI Market Analyzer",

  VERSION: "1.0.0",

  /*
  |----------------------------------------------------------
  | Analysis Settings
  |----------------------------------------------------------
  */

  analysis: {

    maxAnalysisTime: 10000,

    autoStartAfterUpload: true,

    supportedImageTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg"
    ],

    maxImageSizeMB: 10

  },


  /*
  |----------------------------------------------------------
  | AI API
  |----------------------------------------------------------
  */

  api: {

    enabled: false,

    /*
      DO NOT put a private API key here.

      Example only:

      apiKey: "YOUR_API_KEY"

      The key you provided should NOT be exposed
      in browser-side JavaScript.
    */

    apiKey: "",

    endpoint: "",

    model: "",

    timeout: 9000

  },


  /*
  |----------------------------------------------------------
  | Future Signals
  |----------------------------------------------------------
  */

  futureSignals: {

    count: 10,

    markets: [

      "EUR/USD",
      "GBP/USD",
      "USD/JPY",
      "USD/CHF",
      "AUD/USD",
      "USD/CAD",
      "NZD/USD",
      "EUR/GBP",
      "EUR/JPY",
      "GBP/JPY",
      "AUD/JPY",
      "EUR/AUD",
      "EUR/CAD",
      "GBP/CAD",
      "AUD/CAD",
      "USD/SGD",
      "USD/HKD",
      "USD/TRY",
      "USD/MXN",
      "USD/ZAR"

    ]

  },


  /*
  |----------------------------------------------------------
  | UI
  |----------------------------------------------------------
  */

  ui: {

    toastDuration: 3500,

    pageAnimation: true,

    signalAnimation: true,

    loadingAnimation: true

  }

};


/*
|--------------------------------------------------------------------------
| Freeze Configuration
|--------------------------------------------------------------------------
|
| Prevent accidental modification from other scripts.
|
*/

Object.freeze(CONFIG);

Object.freeze(CONFIG.analysis);
Object.freeze(CONFIG.api);
Object.freeze(CONFIG.futureSignals);
Object.freeze(CONFIG.ui);


/*
|--------------------------------------------------------------------------
| Global Access
|--------------------------------------------------------------------------
*/

window.MARKET_ANALYZER_CONFIG = CONFIG;


/*
|--------------------------------------------------------------------------
| Debug Information
|--------------------------------------------------------------------------
*/

console.log(
  "%c AI Market Analyzer Config Loaded ",
  "background:#071321;color:#00e5ff;font-weight:bold;padding:7px;"
);

console.log(
  "Version:",
  CONFIG.VERSION
);

console.log(
  "AI API:",
  CONFIG.api.enabled
    ? "Enabled"
    : "Frontend Demo Mode"
);
