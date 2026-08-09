/* =========================================================
   AI MARKET ANALYZER
   script.js
   Twelve Data based market analysis
========================================================= */

"use strict";

/* ---------------------------------------------------------
   CONFIG
--------------------------------------------------------- */

const CONFIG = window.MARKET_CONFIG || {};

const API_KEY =
  CONFIG.TWELVE_DATA_API_KEY ||
  "";

const TWELVE_BASE =
  CONFIG.TWELVE_DATA_BASE ||
  "https://api.twelvedata.com";

const INTERVAL =
  CONFIG.INTERVAL ||
  "1min";

const OUTPUT_SIZE =
  Number(CONFIG.OUTPUT_SIZE || 80);


/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */

const state = {
  currentPage: "dashboard",
  selectedMarket: "",
  selectedMode: "",
  imageData: null,
  analysisRunning: false,
  lastAnalysis: null
};


/* ---------------------------------------------------------
   DOM HELPERS
--------------------------------------------------------- */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function byId(id) {
  return document.getElementById(id);
}


/* ---------------------------------------------------------
   PAGE NAVIGATION
--------------------------------------------------------- */

function showPage(pageName) {

  state.currentPage = pageName;

  $$(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  const target =
    byId(pageName) ||
    $(`[data-page="${pageName}"]`);

  if (target) {
    target.classList.add("active-page");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  closeMenu();
}


/* ---------------------------------------------------------
   MENU
--------------------------------------------------------- */

const menuButton =
  $(".menu-button") ||
  byId("menuButton");

const sideMenu =
  $(".side-menu") ||
  byId("sideMenu");

const menuOverlay =
  $(".menu-overlay") ||
  byId("menuOverlay");

function openMenu() {

  if (sideMenu)
    sideMenu.classList.add("active");

  if (menuOverlay)
    menuOverlay.classList.add("active");

  if (menuButton)
    menuButton.classList.add("active");
}

function closeMenu() {

  if (sideMenu)
    sideMenu.classList.remove("active");

  if (menuOverlay)
    menuOverlay.classList.remove("active");

  if (menuButton)
    menuButton.classList.remove("active");
}

if (menuButton) {
  menuButton.addEventListener("click", () => {

    if (
      sideMenu &&
      sideMenu.classList.contains("active")
    ) {
      closeMenu();
    } else {
      openMenu();
    }

  });
}

if (menuOverlay) {
  menuOverlay.addEventListener(
    "click",
    closeMenu
  );
}

const closeMenuButton =
  $(".close-menu") ||
  byId("closeMenu");

if (closeMenuButton) {
  closeMenuButton.addEventListener(
    "click",
    closeMenu
  );
}


/* ---------------------------------------------------------
   MENU ITEMS
--------------------------------------------------------- */

$$("[data-open-page]").forEach(button => {

  button.addEventListener("click", () => {

    const page =
      button.dataset.openPage;

    if (page) {
      showPage(page);
    }

  });

});


/* ---------------------------------------------------------
   BACK BUTTON
--------------------------------------------------------- */

$$("[data-back]").forEach(button => {

  button.addEventListener("click", () => {
    showPage("dashboard");
  });

});


/* ---------------------------------------------------------
   DASHBOARD CARDS
--------------------------------------------------------- */

$$("[data-mode]").forEach(card => {

  card.addEventListener("click", () => {

    const mode =
      card.dataset.mode;

    state.selectedMode = mode;

    if (mode === "real") {
      showPage("realMarketPage");
      prepareAnalysisPage("REAL MARKET");
    }

    else if (mode === "otc") {
      showPage("otcMarketPage");
      prepareAnalysisPage("OTC MARKET");
    }

    else if (mode === "future") {
      showPage("futurePage");
      prepareFuturePage();
    }

  });

});


/* ---------------------------------------------------------
   PREPARE ANALYSIS PAGE
--------------------------------------------------------- */

function prepareAnalysisPage(title) {

  const titleElement =
    $(".analysis-page-title");

  if (titleElement) {
    titleElement.textContent = title;
  }

  hideElement(
    ".preview-box"
  );

  hideElement(
    ".analysis-loading"
  );

  hideElement(
    ".result-box"
  );

  state.imageData = null;

  const input =
    $("#chartInput") ||
    $('input[type="file"]');

  if (input) {
    input.value = "";
  }
}


/* ---------------------------------------------------------
   IMAGE INPUT
--------------------------------------------------------- */

const chartInput =
  byId("chartInput") ||
  byId("imageInput") ||
  $('input[type="file"]');

if (chartInput) {

  chartInput.addEventListener(
    "change",
    handleImageUpload
  );

}

async function handleImageUpload(event) {

  const file =
    event.target.files &&
    event.target.files[0];

  if (!file)
    return;

  if (!file.type.startsWith("image/")) {

    showToast(
      "Invalid Image",
      "Please select a chart screenshot."
    );

    return;
  }

  if (file.size > 10 * 1024 * 1024) {

    showToast(
      "Image Too Large",
      "Please select an image smaller than 10MB."
    );

    return;
  }

  try {

    const dataUrl =
      await readImage(file);

    state.imageData = dataUrl;

    showPreview(
      dataUrl,
      file.name
    );

    /*
      Important:
      The screenshot is NOT converted into
      a fake market signal.

      We use the screenshot as the user's
      chart reference, while market data comes
      from Twelve Data.
    */

    const market =
      getSelectedMarket();

    if (!market) {

      showToast(
        "Select Market",
        "Select a market before analysis."
      );

      return;
    }

    await runMarketAnalysis(market);

  } catch (error) {

    console.error(error);

    showToast(
      "Upload Failed",
      "Could not read the selected image."
    );

  }

}


/* ---------------------------------------------------------
   READ IMAGE
--------------------------------------------------------- */

function readImage(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        () =>
          reject(
            new Error(
              "Image reading failed."
            )
          );

      reader.readAsDataURL(file);
    }
  );

}


/* ---------------------------------------------------------
   SHOW PREVIEW
--------------------------------------------------------- */

function showPreview(
  image,
  fileName = ""
) {

  const previewBox =
    $(".preview-box");

  const imageElement =
    $(".preview-image-wrapper img") ||
    $("#previewImage");

  const fileNameElement =
    $(".file-name") ||
    $("#fileName");

  if (imageElement) {
    imageElement.src = image;
  }

  if (fileNameElement) {
    fileNameElement.textContent =
      fileName;
  }

  if (previewBox) {
    previewBox.classList.remove(
      "hidden"
    );
  }

}


/* ---------------------------------------------------------
   REMOVE IMAGE
--------------------------------------------------------- */

$$("[data-remove-image]").forEach(
  button => {

    button.addEventListener(
      "click",
      removeImage
    );

  }
);

const removeButton =
  $("#removeImage");

if (removeButton) {
  removeButton.addEventListener(
    "click",
    removeImage
  );
}

function removeImage() {

  state.imageData = null;

  const input =
    chartInput;

  if (input) {
    input.value = "";
  }

  hideElement(".preview-box");
  hideElement(".analysis-loading");
  hideElement(".result-box");

}


/* ---------------------------------------------------------
   MARKET SELECT
--------------------------------------------------------- */

function getSelectedMarket() {

  const select =
    $("#marketSelect") ||
    $(".market-select");

  if (select && select.value) {
    return select.value;
  }

  /*
    If the user opened Real Market page
    without a select box, try config default.
  */

  return CONFIG.DEFAULT_SYMBOL || "";
}


/* ---------------------------------------------------------
   FETCH TWELVE DATA
--------------------------------------------------------- */

async function fetchCandles(symbol) {

  if (!API_KEY) {

    throw new Error(
      "Twelve Data API key is missing."
    );

  }

  const url =
    `${TWELVE_BASE}/time_series` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${encodeURIComponent(INTERVAL)}` +
    `&outputsize=${OUTPUT_SIZE}` +
    `&apikey=${encodeURIComponent(API_KEY)}` +
    `&format=JSON`;

  const response =
    await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

  const text =
    await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {

    throw new Error(
      "Twelve Data returned invalid data."
    );

  }

  if (!response.ok) {

    throw new Error(
      data.message ||
      `HTTP ${response.status}`
    );

  }

  if (
    data.status === "error" ||
    data.code
  ) {

    throw new Error(
      data.message ||
      "Twelve Data API error."
    );

  }

  if (
    !data.values ||
    !Array.isArray(data.values) ||
    data.values.length < 30
  ) {

    throw new Error(
      "Not enough market candle data."
    );

  }

  return data.values
    .map(candle => ({
      time: candle.datetime,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume || 0)
    }))
    .reverse();

}


/* ---------------------------------------------------------
   MARKET ANALYSIS
--------------------------------------------------------- */

async function runMarketAnalysis(symbol) {

  if (state.analysisRunning)
    return;

  state.analysisRunning = true;

  hideElement(".result-box");

  showAnalysisLoading();

  const start =
    performance.now();

  try {

    /*
      Real market data request.
    */

    const candles =
      await fetchCandles(symbol);

    /*
      Technical calculations.
    */

    const analysis =
      analyzeCandles(candles);

    const elapsed =
      (
        performance.now() -
        start
      ) / 1000;

    analysis.seconds =
      Number(elapsed.toFixed(1));

    state.lastAnalysis =
      analysis;

    finishAnalysis(
      analysis
    );

  } catch (error) {

    console.error(
      "Analysis error:",
      error
    );

    showAnalysisError(
      error.message
    );

  } finally {

    state.analysisRunning = false;

  }

}


/* ---------------------------------------------------------
   TECHNICAL ANALYSIS ENGINE
--------------------------------------------------------- */

function analyzeCandles(candles) {

  const closes =
    candles.map(c => c.close);

  const highs =
    candles.map(c => c.high);

  const lows =
    candles.map(c => c.low);

  const latest =
    candles[candles.length - 1];

  const previous =
    candles[candles.length - 2];

  const ema9 =
    EMA(closes, 9);

  const ema21 =
    EMA(closes, 21);

  const rsi =
    RSI(closes, 14);

  const macd =
    MACD(closes);

  const atr =
    ATR(candles, 14);

  const lastEma9 =
    ema9[ema9.length - 1];

  const lastEma21 =
    ema21[ema21.length - 1];

  const lastRSI =
    rsi[rsi.length - 1];

  const lastMACD =
    macd.macd[
      macd.macd.length - 1
    ];

  const lastSignal =
    macd.signal[
      macd.signal.length - 1
    ];

  const recentHigh =
    Math.max(
      ...highs.slice(-20)
    );

  const recentLow =
    Math.min(
      ...lows.slice(-20)
    );

  let score = 0;

  const checks = [];


  /* EMA trend */

  if (
    Number.isFinite(lastEma9) &&
    Number.isFinite(lastEma21)
  ) {

    if (
      latest.close > lastEma9 &&
      lastEma9 > lastEma21
    ) {

      score += 2;

      checks.push(
        "Bullish EMA alignment"
      );

    }

    else if (
      latest.close < lastEma9 &&
      lastEma9 < lastEma21
    ) {

      score -= 2;

      checks.push(
        "Bearish EMA alignment"
      );

    }

    else {

      checks.push(
        "EMA trend is mixed"
      );

    }

  }


  /* RSI */

  if (Number.isFinite(lastRSI)) {

    if (
      lastRSI >= 52 &&
      lastRSI <= 68
    ) {

      score += 1;

      checks.push(
        "RSI supports bullish momentum"
      );

    }

    else if (
      lastRSI >= 32 &&
      lastRSI < 48
    ) {

      score -= 1;

      checks.push(
        "RSI supports bearish momentum"
      );

    }

    else if (
      lastRSI > 70
    ) {

      checks.push(
        "RSI is overbought"
      );

    }

    else if (
      lastRSI < 30
    ) {

      checks.push(
        "RSI is oversold"
      );

    }

    else {

      checks.push(
        "RSI is neutral"
      );

    }

  }


  /* MACD */

  if (
    Number.isFinite(lastMACD) &&
    Number.isFinite(lastSignal)
  ) {

    if (
      lastMACD > lastSignal
    ) {

      score += 1;

      checks.push(
        "MACD bullish"
      );

    }

    else if (
      lastMACD < lastSignal
    ) {

      score -= 1;

      checks.push(
        "MACD bearish"
      );

    }

  }


  /* Candle momentum */

  if (
    latest.close >
    previous.close
  ) {

    score += 1;

    checks.push(
      "Latest candle momentum is positive"
    );

  }

  else if (
    latest.close <
    previous.close
  ) {

    score -= 1;

    checks.push(
      "Latest candle momentum is negative"
    );

  }


  /* Support / resistance */

  const range =
    recentHigh -
    recentLow;

  if (range > 0) {

    const position =
      (
        latest.close -
        recentLow
      ) / range;

    if (position > 0.70) {

      checks.push(
        "Price is near recent resistance"
      );

    }

    else if (position < 0.30) {

      checks.push(
        "Price is near recent support"
      );

    }

    else {

      checks.push(
        "Price is inside recent range"
      );

    }

  }


  /* -------------------------------------------------------
     SIGNAL RULE

     No random signal.
     No forced UP/DOWN.

     Strong enough evidence only.
  ------------------------------------------------------- */

  let direction =
    "NO SIGNAL";

  if (score >= 4) {
    direction = "UP";
  }

  else if (score <= -4) {
    direction = "DOWN";
  }


  /*
    Confidence is based on actual indicator agreement.
    It is NOT a guaranteed probability of winning.
  */

  const absoluteScore =
    Math.abs(score);

  let confidence =
    50 + absoluteScore * 7;

  confidence =
    Math.min(
      confidence,
      88
    );

  if (
    direction === "NO SIGNAL"
  ) {
    confidence =
      Math.min(
        confidence,
        58
      );
  }


  let trend =
    "Sideways";

  if (score >= 2)
    trend = "Bullish";

  else if (score <= -2)
    trend = "Bearish";


  return {

    signal: direction,

    confidence,

    trend,

    score,

    price: latest.close,

    rsi: Number.isFinite(lastRSI)
      ? Number(lastRSI.toFixed(2))
      : null,

    ema9: Number.isFinite(lastEma9)
      ? Number(lastEma9.toFixed(5))
      : null,

    ema21: Number.isFinite(lastEma21)
      ? Number(lastEma21.toFixed(5))
      : null,

    atr: Number.isFinite(atr)
      ? Number(atr.toFixed(5))
      : null,

    checks,

    candleTime: latest.time

  };

}


/* ---------------------------------------------------------
   EMA
--------------------------------------------------------- */

function EMA(values, period) {

  if (
    !Array.isArray(values) ||
    values.length < period
  ) {
    return [];
  }

  const multiplier =
    2 / (period + 1);

  const result = [];

  let previous =
    values
      .slice(0, period)
      .reduce(
        (a, b) => a + b,
        0
      ) / period;

  for (
    let i = period - 1;
    i < values.length;
    i++
  ) {

    if (i === period - 1) {

      result.push(previous);

      continue;
    }

    previous =
      (
        values[i] -
        previous
      ) *
      multiplier +
      previous;

    result.push(previous);

  }

  return result;

}


/* ---------------------------------------------------------
   RSI
--------------------------------------------------------- */

function RSI(values, period = 14) {

  if (
    values.length <= period
  ) {
    return [];
  }

  let gains = 0;
  let losses = 0;

  for (
    let i = 1;
    i <= period;
    i++
  ) {

    const change =
      values[i] -
      values[i - 1];

    if (change >= 0)
      gains += change;
    else
      losses -= change;

  }

  let avgGain =
    gains / period;

  let avgLoss =
    losses / period;

  const result = [];

  for (
    let i = period + 1;
    i < values.length;
    i++
  ) {

    const change =
      values[i] -
      values[i - 1];

    const gain =
      Math.max(change, 0);

    const loss =
      Math.max(-change, 0);

    avgGain =
      (
        avgGain * (period - 1) +
        gain
      ) / period;

    avgLoss =
      (
        avgLoss * (period - 1) +
        loss
      ) / period;

    if (avgLoss === 0) {

      result.push(100);

    } else {

      const rs =
        avgGain / avgLoss;

      result.push(
        100 -
        100 / (1 + rs)
      );

    }

  }

  return result;

}


/* ---------------------------------------------------------
   MACD
--------------------------------------------------------- */

function MACD(
  values,
  fast = 12,
  slow = 26,
  signalPeriod = 9
) {

  const fastEMA =
    EMA(values, fast);

  const slowEMA =
    EMA(values, slow);

  const macdLine = [];

  const offset =
    slow - fast;

  for (
    let i = 0;
    i < slowEMA.length;
    i++
  ) {

    const fastValue =
      fastEMA[i + offset];

    const slowValue =
      slowEMA[i];

    macdLine.push(
      fastValue -
      slowValue
    );

  }

  const signal =
    EMA(
      macdLine,
      signalPeriod
    );

  return {
    macd: macdLine,
    signal
  };

}


/* ---------------------------------------------------------
   ATR
--------------------------------------------------------- */

function ATR(
  candles,
  period = 14
) {

  if (
    candles.length <= period
  ) {
    return null;
  }

  const ranges = [];

  for (
    let i = 1;
    i < candles.length;
    i++
  ) {

    const high =
      candles[i].high;

    const low =
      candles[i].low;

    const previousClose =
      candles[i - 1].close;

    const trueRange =
      Math.max(
        high - low,
        Math.abs(
          high - previousClose
        ),
        Math.abs(
          low - previousClose
        )
      );

    ranges.push(trueRange);

  }

  const recent =
    ranges.slice(-period);

  return (
    recent.reduce(
      (a, b) => a + b,
      0
    ) / recent.length
  );

}


/* ---------------------------------------------------------
   ANALYSIS LOADING UI
--------------------------------------------------------- */

function showAnalysisLoading() {

  const loading =
    $(".analysis-loading");

  if (!loading)
    return;

  loading.classList.remove(
    "hidden"
  );

  const steps =
    $$(".analysis-step", loading);

  steps.forEach(
    step => {
      step.classList.remove(
        "active",
        "done"
      );
    }
  );

  let index = 0;

  const timer =
    setInterval(() => {

      if (
        index >= steps.length
      ) {

        clearInterval(timer);

        return;
      }

      if (index > 0) {

        steps[index - 1]
          .classList
          .remove("active");

        steps[index - 1]
          .classList
          .add("done");

      }

      steps[index]
        .classList
        .add("active");

      index++;

    }, 650);

  loading.dataset.timer =
    String(timer);

}


/* ---------------------------------------------------------
   FINISH ANALYSIS
--------------------------------------------------------- */

function finishAnalysis(
  analysis
) {

  stopLoadingAnimation();

  hideElement(
    ".analysis-loading"
  );

  renderResult(
    analysis
  );

  showElement(
    ".result-box"
  );

}


/* ---------------------------------------------------------
   RENDER RESULT
--------------------------------------------------------- */

function renderResult(
  analysis
) {

  const signalCard =
    $(".signal-card");

  const arrow =
    $(".signal-arrow");

  const signalText =
    $(".signal-text");

  const confidence =
    $(".confidence-value") ||
    $(".indicator-top strong");

  const progress =
    $(".progress-fill");

  const trend =
    $(".trend-value");

  const time =
    $(".analysis-time");

  const signal =
    analysis.signal;


  if (signalCard) {

    signalCard.classList.remove(
      "down",
      "no-signal"
    );

    if (signal === "DOWN") {
      signalCard.classList.add(
        "down"
      );
    }

    if (signal === "NO SIGNAL") {
      signalCard.classList.add(
        "no-signal"
      );
    }

  }


  if (arrow) {

    if (signal === "UP")
      arrow.textContent = "↑";

    else if (signal === "DOWN")
      arrow.textContent = "↓";

    else
      arrow.textContent = "—";

  }


  if (signalText) {

    signalText.textContent =
      signal;

  }


  if (confidence) {

    confidence.textContent =
      `${analysis.confidence}%`;

  }


  if (progress) {

    requestAnimationFrame(() => {

      progress.style.width =
        `${analysis.confidence}%`;

    });

  }


  if (trend) {

    trend.textContent =
      analysis.trend;

  }


  if (time) {

    time.textContent =
      `${analysis.seconds}s`;

  }


  /*
    Optional extra indicator fields
  */

  setText(
    ".rsi-value",
    analysis.rsi !== null
      ? analysis.rsi
      : "--"
  );

  setText(
    ".ema9-value",
    analysis.ema9 !== null
      ? analysis.ema9
      : "--"
  );

  setText(
    ".ema21-value",
    analysis.ema21 !== null
      ? analysis.ema21
      : "--"
  );


  /*
    Analysis checks
  */

  const checksContainer =
    $(".analysis-checks");

  if (checksContainer) {

    checksContainer.innerHTML =
      "";

    analysis.checks
      .slice(0, 6)
      .forEach(check => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "analysis-check";

        item.innerHTML =
          `<span>✓</span>
           <p>${escapeHTML(check)}</p>`;

        checksContainer
          .appendChild(item);

      });

  }

}


/* ---------------------------------------------------------
   ANALYSIS ERROR
--------------------------------------------------------- */

function showAnalysisError(
  message
) {

  stopLoadingAnimation();

  hideElement(
    ".analysis-loading"
  );

  hideElement(
    ".result-box"
  );

  showToast(
    "Analysis Failed",
    message ||
    "Unable to retrieve real market data."
  );

}


/* ---------------------------------------------------------
   FUTURE PAGE
--------------------------------------------------------- */

function prepareFuturePage() {

  const select =
    $("#futureMarketSelect") ||
    $("#marketSelect");

  if (
    select &&
    select.options.length === 0
  ) {

    loadFutureMarkets(
      select
    );

  }

}


/* ---------------------------------------------------------
   FUTURE MARKET LIST
--------------------------------------------------------- */

const FUTURE_MARKETS = [

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
  "CHF/JPY",
  "XAU/USD",
  "XAG/USD",
  "BTC/USD",
  "ETH/USD",
  "USD/TRY"

];


function loadFutureMarkets(
  select
) {

  select.innerHTML =
    `<option value="">
       Select Market
     </option>`;

  FUTURE_MARKETS
    .forEach(symbol => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        symbol;

      option.textContent =
        symbol;

      select.appendChild(
        option
      );

    });

}


/* ---------------------------------------------------------
   GENERATE FUTURE SIGNALS
--------------------------------------------------------- */

const generateButton =
  $("#generateFutureSignals") ||
  $(".generate-button");

if (generateButton) {

  generateButton.addEventListener(
    "click",
    generateFutureSignals
  );

}


async function generateFutureSignals() {

  const select =
    $("#futureMarketSelect") ||
    $("#marketSelect");

  const symbol =
    select &&
    select.value;

  if (!symbol) {

    showToast(
      "Select Market",
      "Please select a market first."
    );

    return;
  }

  if (!API_KEY) {

    showToast(
      "API Key Missing",
      "Add your Twelve Data API key in config.js."
    );

    return;
  }

  const button =
    generateButton;

  if (button) {

    button.disabled = true;

    button.dataset.oldText =
      button.textContent;

    button.textContent =
      "Analyzing market...";

  }

  try {

    const candles =
      await fetchCandles(symbol);

    const analysis =
      analyzeCandles(candles);

    renderFutureSignals(
      symbol,
      analysis
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Future Analysis Failed",
      error.message
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        button.dataset.oldText ||
        "Generate Signals";

    }

  }

}


/* ---------------------------------------------------------
   FUTURE SIGNAL RENDER
--------------------------------------------------------- */

function renderFutureSignals(
  symbol,
  baseAnalysis
) {

  const container =
    $(".signal-list") ||
    $("#signalList");

  if (!container)
    return;

  container.innerHTML =
    "";

  /*
    These are NOT 10 fake predictions.

    We only display the current analysis
    repeatedly with time labels if the UI
    requests 10 slots.

    To avoid misleading the user, only the
    first/current market analysis is given
    as a real signal. Remaining slots show
    WAIT until fresh candle data is obtained.
  */

  const now =
    new Date();

  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const row =
      document.createElement(
        "div"
      );

    let direction =
      "WAIT";

    let className =
      "none";

    /*
      Only current verified analysis.
      Future candles do not exist yet.
    */

    if (i === 0) {

      direction =
        baseAnalysis.signal;

      className =
        direction === "UP"
          ? "up"
          : direction === "DOWN"
            ? "down"
            : "none";

    }

    const rowTime =
      new Date(
        now.getTime() +
        i * 60000
      );

    const timeString =
      rowTime.toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    row.className =
      `future-signal ${className}`;

    row.style.animationDelay =
      `${i * 50}ms`;

    row.innerHTML = `
      <div class="future-signal-time">
        ${timeString}
      </div>

      <div class="future-signal-main">
        <strong>
          ${escapeHTML(symbol)}
        </strong>

        <small>
          ${
            i === 0
              ? "Verified current analysis"
              : "Waiting for fresh market data"
          }
        </small>
      </div>

      <div class="future-signal-direction">
        ${direction}
      </div>
    `;

    container.appendChild(
      row
    );

  }

  showElement(
    ".signals-container"
  );

}


/* ---------------------------------------------------------
   LOADING TIMER
--------------------------------------------------------- */

function stopLoadingAnimation() {

  const loading =
    $(".analysis-loading");

  if (!loading)
    return;

  const timer =
    Number(
      loading.dataset.timer
    );

  if (timer) {

    clearInterval(timer);

    delete loading.dataset.timer;

  }

}


/* ---------------------------------------------------------
   ELEMENT HELPERS
--------------------------------------------------------- */

function hideElement(
  selector
) {

  const element =
    typeof selector === "string"
      ? $(selector)
      : selector;

  if (element) {
    element.classList.add(
      "hidden"
    );
  }

}

function showElement(
  selector
) {

  const element =
    typeof selector === "string"
      ? $(selector)
      : selector;

  if (element) {
    element.classList.remove(
      "hidden"
    );
  }

}

function setText(
  selector,
  value
) {

  const element =
    $(selector);

  if (element) {
    element.textContent =
      value;
  }

}


/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */

let toastTimer = null;

function showToast(
  title,
  message
) {

  const toast =
    $(".toast");

  if (!toast) {

    alert(
      `${title}\n\n${message}`
    );

    return;
  }

  const titleElement =
    $(".toast-content strong");

  const messageElement =
    $(".toast-content p");

  if (titleElement)
    titleElement.textContent =
      title;

  if (messageElement)
    messageElement.textContent =
      message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 5000);

}


const toastClose =
  $(".toast > button");

if (toastClose) {

  toastClose.addEventListener(
    "click",
    () => {

      const toast =
        $(".toast");

      if (toast)
        toast.classList.remove(
          "show"
        );

    }
  );

}


/* ---------------------------------------------------------
   ESCAPE HTML
--------------------------------------------------------- */

function escapeHTML(
  value
) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ---------------------------------------------------------
   INITIALIZE
--------------------------------------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      Make sure dashboard starts first.
    */

    const pages =
      $$(".page");

    if (
      pages.length &&
      !$(".active-page")
    ) {

      const dashboard =
        byId("dashboard") ||
        pages[0];

      dashboard.classList.add(
        "active-page"
      );

    }

    /*
      Load future market list.
    */

    const futureSelect =
      $("#futureMarketSelect");

    if (futureSelect) {
      loadFutureMarkets(
        futureSelect
      );
    }

    console.log(
      "AI Market Analyzer initialized."
    );

    console.log(
      "Data source: Twelve Data"
    );

  }
);


/* ---------------------------------------------------------
   SECURITY / DEBUG INFO
--------------------------------------------------------- */

if (!API_KEY) {

  console.warn(
    "Twelve Data API key is not configured. " +
    "Real analysis will not run until config.js is configured."
  );

     }
