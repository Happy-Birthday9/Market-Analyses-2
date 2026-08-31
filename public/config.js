"use strict";

const CONFIG = {
  APP_NAME: "AI Market Analyzer",
  VERSION: "1.1.0",

  analysis: {
    maxAnalysisTime: 30000,
    autoStartAfterUpload: true,
    supportedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    maxImageSizeMB: 10
  },

  api: {
    enabled: true,
    endpoint: "/api/analyze",
    timeout: 60000
  },

  futureSignals: {
    count: 10,
    markets: [
      "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
      "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "EUR/AUD", "EUR/CAD", "GBP/CAD",
      "AUD/CAD", "NZD/JPY", "GBP/AUD", "GBP/NZD", "EUR/NZD", "AUD/NZD",
      "USD/SGD", "USD/HKD", "USD/TRY", "USD/MXN", "USD/ZAR", "USD/INR", "USD/BRL",
      "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD", "US30", "US100", "GER40", "UK100"
    ]
  },

  ui: {
    toastDuration: 3500,
    pageAnimation: true,
    signalAnimation: true,
    loadingAnimation: true
  }
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.analysis);
Object.freeze(CONFIG.api);
Object.freeze(CONFIG.futureSignals);
Object.freeze(CONFIG.ui);
window.MARKET_ANALYZER_CONFIG = CONFIG;

console.log("%c AI Market Analyzer Config ", "background:#071321;color:#00e5ff;padding:6px;");
