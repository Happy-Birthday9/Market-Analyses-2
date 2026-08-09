"use strict";

/* =========================================================
   AI MARKET ANALYZER
   GitHub Pages / Twelve Data Version

   IMPORTANT:
   - No random/demo signals
   - Uses real Twelve Data market data
   - Signal = technical-analysis result
   - If data is insufficient -> NO SIGNAL
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API_KEY =
  window.MARKET_ANALYZER_CONFIG?.api?.apiKey || "";

const TWELVE_DATA =
  "https://api.twelvedata.com";

const SETTINGS = {

  interval: "1min",

  candles: 100,

  timeout: 9000,

  rsiPeriod: 14,

  emaFast: 9,

  emaSlow: 21,

  macdFast: 12,

  macdSlow: 26,

  macdSignal: 9

};


/* =========================================================
   STATE
========================================================= */

let currentMode = "real";

let selectedMarket = "";

let currentAnalysis = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {
  return document.querySelector(selector);
}


function $$(selector) {
  return document.querySelectorAll(selector);
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initializeMenu();

    initializeNavigation();

    initializeRealAnalysis();

    initializeOtcAnalysis();

    initializeFutureSignals();

    initializeToast();

    console.log(
      "%c AI MARKET ANALYZER ",
      "background:#071321;color:#00e5ff;font-weight:bold;padding:8px;"
    );

    console.log(
      "Demo/random signals: DISABLED"
    );

  }
);


/* =========================================================
   MENU
========================================================= */

function initializeMenu() {

  const menuButton =
    $("#menuButton");

  const sideMenu =
    $("#sideMenu");

  const closeButton =
    $("#closeMenu");

  const overlay =
    $("#menuOverlay");


  menuButton?.addEventListener(
    "click",
    () => {

      sideMenu?.classList.toggle("open");

      overlay?.classList.toggle("show");

      menuButton.classList.toggle("active");

    }
  );


  closeButton?.addEventListener(
    "click",
    closeMenu
  );


  overlay?.addEventListener(
    "click",
    closeMenu
  );

}


function closeMenu() {

  $("#sideMenu")?.classList.remove("open");

  $("#menuOverlay")?.classList.remove("show");

  $("#menuButton")?.classList.remove("active");

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

  $$(".menu-item").forEach(
    item => {

      item.addEventListener(
        "click",
        () => {

          const page =
            item.dataset.page;

          if (!page) return;

          showPage(page);

          closeMenu();

        }
      );

    }
  );

}


function showPage(pageId) {

  $$(".page").forEach(
    page => {

      page.classList.remove(
        "active-page"
      );

    }
  );


  const page =
    document.getElementById(
      pageId
    );


  if (!page) return;


  page.classList.add(
    "active-page"
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   API REQUEST
========================================================= */

async function tdRequest(
  endpoint,
  params = {}
) {

  if (!API_KEY) {

    throw new Error(
      "Twelve Data API key is missing."
    );

  }


  const query =
    new URLSearchParams({
      ...params,
      apikey: API_KEY
    });


  const controller =
    new AbortController();


  const timer =
    setTimeout(
      () => controller.abort(),
      SETTINGS.timeout
    );


  try {

    const response =
      await fetch(
        `${TWELVE_DATA}${endpoint}?${query}`,
        {
          method: "GET",

          signal:
            controller.signal,

          headers: {
            "Accept":
              "application/json"
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Twelve Data request failed."
      );

    }


    if (
      data.status === "error"
    ) {

      throw new Error(
        data.message ||
        "Twelve Data returned an error."
      );

    }


    return data;

  }

  finally {

    clearTimeout(timer);

  }

}


/* =========================================================
   GET CANDLES
========================================================= */

async function getCandles(
  symbol
) {

  const data =
    await tdRequest(
      "/time_series",
      {

        symbol,

        interval:
          SETTINGS.interval,

        outputsize:
          SETTINGS.candles,

        timezone:
          "UTC"

      }
    );


  if (
    !Array.isArray(
      data.values
    )
  ) {

    throw new Error(
      "No candle data received."
    );

  }


  return data.values
    .map(c => ({

      datetime:
        c.datetime,

      open:
        Number(c.open),

      high:
        Number(c.high),

      low:
        Number(c.low),

      close:
        Number(c.close),

      volume:
        Number(c.volume || 0)

    }))
    .filter(
      c =>
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    );

}


/* =========================================================
   EMA
========================================================= */

function calculateEMA(
  prices,
  period
) {

  if (
    prices.length <
    period
  ) {

    return [];

  }


  const result = [];

  const multiplier =
    2 /
    (period + 1);


  let ema =
    prices
      .slice(0, period)
      .reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
    period;


  result.push(ema);


  for (
    let i = period;
    i < prices.length;
    i++
  ) {

    ema =
      (
        prices[i] -
        ema
      ) *
      multiplier +
      ema;


    result.push(ema);

  }


  return result;

}


/* =========================================================
   RSI
========================================================= */

function calculateRSI(
  prices,
  period = 14
) {

  if (
    prices.length <= period
  ) {

    return null;

  }


  let gains = 0;

  let losses = 0;


  for (
    let i = 1;
    i <= period;
    i++
  ) {

    const change =
      prices[i] -
      prices[i - 1];


    if (change >= 0) {

      gains += change;

    }

    else {

      losses +=
        Math.abs(change);

    }

  }


  let avgGain =
    gains / period;


  let avgLoss =
    losses / period;


  for (
    let i = period + 1;
    i < prices.length;
    i++
  ) {

    const change =
      prices[i] -
      prices[i - 1];


    const gain =
      change > 0
        ? change
        : 0;


    const loss =
      change < 0
        ? Math.abs(change)
        : 0;


    avgGain =
      (
        avgGain *
        (period - 1) +
        gain
      ) /
      period;


    avgLoss =
      (
        avgLoss *
        (period - 1) +
        loss
      ) /
      period;

  }


  if (avgLoss === 0) {

    return 100;

  }


  const rs =
    avgGain /
    avgLoss;


  return (
    100 -
    100 / (1 + rs)
  );

}


/* =========================================================
   MACD
========================================================= */

function calculateMACD(
  prices
) {

  const fast =
    calculateEMA(
      prices,
      SETTINGS.macdFast
    );


  const slow =
    calculateEMA(
      prices,
      SETTINGS.macdSlow
    );


  if (
    fast.length === 0 ||
    slow.length === 0
  ) {

    return null;

  }


  /*
    Align fast and slow EMA
  */

  const offset =
    fast.length -
    slow.length;


  const macdLine = [];


  for (
    let i = 0;
    i < slow.length;
    i++
  ) {

    macdLine.push(
      fast[i + offset] -
      slow[i]
    );

  }


  const signalLine =
    calculateEMA(
      macdLine,
      SETTINGS.macdSignal
    );


  if (
    signalLine.length === 0
  ) {

    return null;

  }


  const latestMACD =
    macdLine[
      macdLine.length - 1
    ];


  const latestSignal =
    signalLine[
      signalLine.length - 1
    ];


  return {

    macd:
      latestMACD,

    signal:
      latestSignal,

    bullish:
      latestMACD >
      latestSignal,

    bearish:
      latestMACD <
      latestSignal

  };

}


/* =========================================================
   CANDLE PATTERN
========================================================= */

function detectPattern(
  candles
) {

  if (
    candles.length < 3
  ) {

    return "Insufficient data";

  }


  const current =
    candles[0];

  const previous =
    candles[1];


  const currentBullish =
    current.close >
    current.open;


  const currentBearish =
    current.close <
    current.open;


  const previousBullish =
    previous.close >
    previous.open;


  const previousBearish =
    previous.close <
    previous.open;


  /*
    Bullish engulfing
  */

  if (
    currentBullish &&
    previousBearish &&
    current.open <=
      previous.close &&
    current.close >=
      previous.open
  ) {

    return "Bullish Engulfing";

  }


  /*
    Bearish engulfing
  */

  if (
    currentBearish &&
    previousBullish &&
    current.open >=
      previous.close &&
    current.close <=
      previous.open
  ) {

    return "Bearish Engulfing";

  }


  /*
    Doji
  */

  const body =
    Math.abs(
      current.close -
      current.open
    );


  const range =
    current.high -
    current.low;


  if (
    range > 0 &&
    body / range < 0.1
  ) {

    return "Doji";

  }


  return "Price Action";

}


/* =========================================================
   SUPPORT / RESISTANCE
========================================================= */

function calculateLevels(
  candles
) {

  const recent =
    candles.slice(
      0,
      Math.min(
        30,
        candles.length
      )
    );


  const highs =
    recent.map(
      c => c.high
    );


  const lows =
    recent.map(
      c => c.low
    );


  return {

    resistance:
      Math.max(...highs),

    support:
      Math.min(...lows)

  };

}


/* =========================================================
   TREND
========================================================= */

function calculateTrend(
  candles
) {

  const closes =
    candles.map(
      c => c.close
    );


  const emaFast =
    calculateEMA(
      closes,
      SETTINGS.emaFast
    );


  const emaSlow =
    calculateEMA(
      closes,
      SETTINGS.emaSlow
    );


  if (
    emaFast.length === 0 ||
    emaSlow.length === 0
  ) {

    return {
      trend: "Unknown",
      bullish: false,
      bearish: false
    };

  }


  const fast =
    emaFast[
      emaFast.length - 1
    ];


  const slow =
    emaSlow[
      emaSlow.length - 1
    ];


  const price =
    closes[
      closes.length - 1
    ];


  if (
    price > fast &&
    fast > slow
  ) {

    return {

      trend:
        "Strong Bullish",

      bullish: true,

      bearish: false

    };

  }


  if (
    price < fast &&
    fast < slow
  ) {

    return {

      trend:
        "Strong Bearish",

      bullish: false,

      bearish: true

    };

  }


  if (
    price > slow
  ) {

    return {

      trend:
        "Bullish",

      bullish: true,

      bearish: false

    };

  }


  if (
    price < slow
  ) {

    return {

      trend:
        "Bearish",

      bullish: false,

      bearish: true

    };

  }


  return {

    trend:
      "Sideways",

    bullish: false,

    bearish: false

  };

}


/* =========================================================
   ANALYSIS ENGINE
========================================================= */

function analyzeMarket(
  candles
) {

  if (
    candles.length < 40
  ) {

    return {

      signal:
        "NO SIGNAL",

      confidence:
        0,

      reason:
        "Not enough market data."

    };

  }


  const closes =
    candles
      .map(c => c.close)
      .reverse();


  const trend =
    calculateTrend(
      candles
    );


  const rsi =
    calculateRSI(
      closes,
      SETTINGS.rsiPeriod
    );


  const macd =
    calculateMACD(
      closes
    );


  const levels =
    calculateLevels(
      candles
    );


  const pattern =
    detectPattern(
      candles
    );


  const currentPrice =
    candles[0].close;


  /*
    Score system.

    This is NOT random.

    Every point comes from
    real market data.
  */

  let score = 0;


  /*
    Trend
  */

  if (trend.bullish) {

    score += 3;

  }

  if (trend.bearish) {

    score -= 3;

  }


  /*
    RSI
  */

  if (
    rsi !== null
  ) {

    if (
      rsi >= 52 &&
      rsi <= 68
    ) {

      score += 2;

    }

    else if (
      rsi <= 48 &&
      rsi >= 32
    ) {

      score -= 2;

    }

  }


  /*
    MACD
  */

  if (macd?.bullish) {

    score += 2;

  }

  if (macd?.bearish) {

    score -= 2;

  }


  /*
    Pattern
  */

  if (
    pattern ===
    "Bullish Engulfing"
  ) {

    score += 2;

  }


  if (
    pattern ===
    "Bearish Engulfing"
  ) {

    score -= 2;

  }


  /*
    Price near resistance/support
  */

  const range =
    levels.resistance -
    levels.support;


  if (range > 0) {

    const position =
      (
        currentPrice -
        levels.support
      ) /
      range;


    /*
      Avoid blindly calling UP
      right below resistance.
    */

    if (
      position > 0.85
    ) {

      score -= 1;

    }


    /*
      Avoid blindly calling DOWN
      right above support.
    */

    if (
      position < 0.15
    ) {

      score += 1;

    }

  }


  /*
    Final decision
  */

  let signal =
    "NO SIGNAL";


  let confidence = 0;


  const absScore =
    Math.abs(score);


  if (
    score >= 6
  ) {

    signal = "UP";

    confidence =
      Math.min(
        92,
        60 +
        absScore * 5
      );

  }

  else if (
    score <= -6
  ) {

    signal = "DOWN";

    confidence =
      Math.min(
        92,
        60 +
        absScore * 5
      );

  }

  else {

    signal =
      "NO SIGNAL";

    confidence =
      Math.min(
        58,
        40 +
        absScore * 3
      );

  }


  return {

    signal,

    confidence:
      Math.round(
        confidence
      ),

    score,

    trend:
      trend.trend,

    pattern,

    momentum:
      rsi === null
        ? "Unknown"
        : rsi >= 55
          ? "Bullish"
          : rsi <= 45
            ? "Bearish"
            : "Neutral",

    rsi:
      rsi === null
        ? null
        : Number(
            rsi.toFixed(2)
          ),

    macd:
      macd
        ? Number(
            macd.macd.toFixed(6)
          )
        : null,

    support:
      levels.support,

    resistance:
      levels.resistance,

    price:
      currentPrice

  };

}


/* =========================================================
   MAIN ANALYSIS
========================================================= */

async function runAnalysis(
  symbol,
  mode
) {

  const started =
    performance.now();


  showAnalysisUI(
    mode,
    true
  );


  try {

    /*
      1. Get real candles
    */

    updateAnalysisStep(
      mode,
      0
    );


    const candles =
      await getCandles(
        symbol
      );


    /*
      2. Check data
    */

    updateAnalysisStep(
      mode,
      1
    );


    if (
      candles.length < 40
    ) {

      throw new Error(
        "Not enough candle data for reliable analysis."
      );

    }


    /*
      3. Technical analysis
    */

    updateAnalysisStep(
      mode,
      2
    );


    const result =
      analyzeMarket(
        candles
      );


    /*
      4. Show pattern
    */

    updateAnalysisStep(
      mode,
      3
    );


    /*
      5. Finish
    */

    updateAnalysisStep(
      mode,
      4
    );


    const elapsed =
      (
        (
          performance.now() -
          started
        ) /
        1000
      ).toFixed(1);


    result.analysisTime =
      elapsed;


    result.symbol =
      symbol;


    result.mode =
      mode;


    currentAnalysis =
      result;


    displayResult(
      result,
      mode
    );


    showToast(
      "Analysis Complete",
      `${symbol} analyzed using live market data.`,
      "success"
    );


    return result;

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "Analysis Failed",
      error.message ||
      "Unable to analyze market.",
      "error"
    );


    displayNoSignal(
      mode,
      error.message
    );


    return null;

  }

  finally {

    showAnalysisUI(
      mode,
      false
    );

  }

}


/* =========================================================
   ANALYSIS UI
========================================================= */

function showAnalysisUI(
  mode,
  loading
) {

  const prefix =
    mode === "otc"
      ? "otc"
      : "real";


  const progress =
    $(`#${prefix}AnalysisProgress`);


  const result =
    $(`#${prefix}ResultBox`);


  if (loading) {

    progress?.classList.remove(
      "hidden"
    );


    result?.classList.add(
      "hidden"
    );

  }

  else {

    progress?.classList.add(
      "hidden"
    );

  }

}


function updateAnalysisStep(
  mode,
  index
) {

  const prefix =
    mode === "otc"
      ? "otc"
      : "real";


  const steps =
    $$(
      `#${prefix}AnalysisSteps .analysis-step`
    );


  steps.forEach(
    (step, i) => {

      step.classList.remove(
        "active"
      );

      step.classList.remove(
        "done"
      );


      if (i < index) {

        step.classList.add(
          "done"
        );

      }


      if (i === index) {

        step.classList.add(
          "active"
        );

      }

    }
  );

}


/* =========================================================
   DISPLAY RESULT
========================================================= */

function displayResult(
  result,
  mode
) {

  const prefix =
    mode === "otc"
      ? "otc"
      : "real";


  const box =
    $(`#${prefix}ResultBox`);


  const signal =
    $(`#${prefix}Signal`);


  const signalText =
    $(`#${prefix}SignalText`);


  const confidence =
    $(`#${prefix}Confidence`);


  const confidenceFill =
    $(`#${prefix}ConfidenceFill`);


  const trend =
    $(`#${prefix}Trend`);


  const pattern =
    $(`#${prefix}Pattern`);


  const momentum =
    $(`#${prefix}Momentum`);


  const resultTime =
    $(`#${prefix}ResultTime`);


  if (
    result.signal ===
    "UP"
  ) {

    signal?.classList.remove(
      "down"
    );

    if (signalText) {

      signalText.textContent =
        "UP";

    }

  }

  else if (
    result.signal ===
    "DOWN"
  ) {

    signal?.classList.add(
      "down"
    );

    if (signalText) {

      signalText.textContent =
        "DOWN";

    }

  }

  else {

    signal?.classList.remove(
      "down"
    );

    signal?.classList.add(
      "no-signal"
    );


    if (signalText) {

      signalText.textContent =
        "NO SIGNAL";

    }

  }


  if (confidence) {

    confidence.textContent =
      `${result.confidence}%`;

  }


  if (confidenceFill) {

    confidenceFill.style.width =
      `${result.confidence}%`;

  }


  if (trend) {

    trend.textContent =
      result.trend ||
      "Unknown";

  }


  if (pattern) {

    pattern.textContent =
      result.pattern ||
      "Unknown";

  }


  if (momentum) {

    momentum.textContent =
      result.momentum ||
      "Unknown";

  }


  if (resultTime) {

    resultTime.textContent =
      `${result.analysisTime}s`;

  }


  box?.classList.remove(
    "hidden"
  );


  /*
    Restart animation
  */

  if (signal) {

    signal.style.animation =
      "none";

    void signal.offsetWidth;

    signal.style.animation =
      "";

  }

}


/* =========================================================
   NO SIGNAL
========================================================= */

function displayNoSignal(
  mode,
  reason
) {

  displayResult(
    {

      signal:
        "NO SIGNAL",

      confidence:
        0,

      trend:
        "Unavailable",

      pattern:
        reason ||
        "Analysis unavailable",

      momentum:
        "Unavailable",

      analysisTime:
        "--"

    },

    mode
  );

}


/* =========================================================
   REAL ANALYSIS INPUT
========================================================= */

function initializeRealAnalysis() {

  const input =
    $("#realChartInput");


  if (!input) return;


  input.addEventListener(
    "change",
    async () => {

      const file =
        input.files?.[0];


      if (!file) return;


      /*
        Screenshot cannot automatically
        become a Twelve Data symbol.

        Ask the user for market if
        no symbol is available.
      */

      const symbol =
        await askForMarket();


      if (!symbol) {

        showToast(
          "Market Required",
          "Select the market shown in your chart.",
          "error"
        );

        input.value = "";

        return;

      }


      currentMode =
        "real";


      selectedMarket =
        symbol;


      showImagePreview(
        file,
        "real"
      );


      await runAnalysis(
        symbol,
        "real"
      );

    }
  );

}


/* =========================================================
   OTC ANALYSIS INPUT
========================================================= */

function initializeOtcAnalysis() {

  const input =
    $("#otcChartInput");


  if (!input) return;


  input.addEventListener(
    "change",
    async () => {

      const file =
        input.files?.[0];


      if (!file) return;


      const symbol =
        await askForMarket();


      if (!symbol) {

        showToast(
          "Market Required",
          "Select the OTC market shown in your chart.",
          "error"
        );

        input.value = "";

        return;

      }


      currentMode =
        "otc";


      selectedMarket =
        symbol;


      showImagePreview(
        file,
        "otc"
      );


      await runAnalysis(
        symbol,
        "otc"
      );

    }
  );

}


/* =========================================================
   MARKET SELECT
========================================================= */

async function askForMarket() {

  const markets = [

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
    "BTC/USD",
    "ETH/USD",
    "XAU/USD"

  ];


  const answer =
    prompt(
      "Enter/select the market symbol:\n\n" +
      markets.join("\n")
    );


  if (!answer) {

    return null;

  }


  const normalized =
    answer
      .trim()
      .toUpperCase();


  if (
    normalized.length < 3
  ) {

    return null;

  }


  return normalized;

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function showImagePreview(
  file,
  mode
) {

  const prefix =
    mode === "otc"
      ? "otc"
      : "real";


  const image =
    $(`#${prefix}PreviewImage`);


  const box =
    $(`#${prefix}PreviewBox`);


  const name =
    $(`#${prefix}FileName`);


  if (image) {

    image.src =
      URL.createObjectURL(
        file
      );

  }


  if (name) {

    name.textContent =
      file.name;

  }


  box?.classList.remove(
    "hidden"
  );

}


/* =========================================================
   FUTURE SIGNALS
========================================================= */

function initializeFutureSignals() {

  const select =
    $("#marketSelect");


  const button =
    $("#generateSignalsButton");


  const list =
    $("#signalList");


  const container =
    $("#signalsContainer");


  if (!select || !button) {
    return;
  }


  button.addEventListener(
    "click",
    async () => {

      const market =
        select.value;


      if (!market) {

        showToast(
          "Select Market",
          "Please select a market.",
          "error"
        );

        return;

      }


      button.disabled =
        true;


      try {

        const candles =
          await getCandles(
            market
          );


        if (
          candles.length < 40
        ) {

          throw new Error(
            "Not enough market data."
          );

        }


        const result =
          analyzeMarket(
            candles
          );


        if (list) {

          list.innerHTML = "";

        }


        /*
          IMPORTANT:

          No fake 10 different signals.

          The same current analysis is
          shown only when conditions are
          strong enough.

          Uncertain market = NO SIGNAL.
        */

        for (
          let i = 0;
          i < 10;
          i++
        ) {

          createFutureCard(
            {
              market,

              direction:
                result.signal,

              confidence:
                result.confidence,

              trend:
                result.trend,

              time:
                futureTime(
                  i + 1
                )

            },

            i,

            list

          );

        }


        container?.classList.remove(
          "hidden"
        );


        showToast(
          "Analysis Ready",
          "Signals are based on current market data.",
          "success"
        );

      }

      catch (error) {

        showToast(
          "Signal Error",
          error.message,
          "error"
        );

      }

      finally {

        button.disabled =
          false;

      }

    }
  );

}


/* =========================================================
   FUTURE CARD
========================================================= */

function createFutureCard(
  signal,
  index,
  container
) {

  if (!container) return;


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "future-signal-card";


  const direction =
    signal.direction;


  const className =
    direction === "UP"
      ? "up"
      : direction === "DOWN"
        ? "down"
        : "neutral";


  card.innerHTML = `

    <div class="signal-number">
      ${String(index + 1).padStart(2, "0")}
    </div>

    <div class="future-signal-market">

      <strong>
        ${escapeHTML(
          signal.market
        )}
      </strong>

      <small>
        ${escapeHTML(
          signal.trend
        )}
      </small>

    </div>

    <div class="signal-time">
      ${escapeHTML(
        signal.time
      )}
    </div>

    <div class="direction ${className}">
      ${
        direction === "UP"
          ? "↑ UP"
          : direction === "DOWN"
            ? "↓ DOWN"
            : "NO SIGNAL"
      }
    </div>

  `;


  container.appendChild(
    card
  );

}


/* =========================================================
   FUTURE TIME
========================================================= */

function futureTime(
  minutes
) {

  const date =
    new Date(
      Date.now() +
      minutes *
      60000
    );


  return date.toLocaleTimeString(
    [],
    {
      hour:
        "2-digit",

      minute:
        "2-digit"

    }
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   TOAST
========================================================= */

function initializeToast() {

  $("#toastClose")?.addEventListener(
    "click",
    hideToast
  );

}


function showToast(
  title,
  message,
  type = "success"
) {

  const toast =
    $("#toast");


  if (!toast) {

    alert(
      `${title}\n${message}`
    );

    return;

  }


  const titleElement =
    $("#toastTitle");


  const messageElement =
    $("#toastMessage");


  if (titleElement) {

    titleElement.textContent =
      title;

  }


  if (messageElement) {

    messageElement.textContent =
      message;

  }


  const icon =
    toast.querySelector(
      ".toast-icon"
    );


  if (icon) {

    icon.textContent =
      type === "error"
        ? "×"
        : "✓";

  }


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.marketToastTimer
  );


  window.marketToastTimer =
    setTimeout(
      hideToast,
      3500
    );

}


function hideToast() {

  $("#toast")?.classList.remove(
    "show"
  );

}


/* =========================================================
   EXPORT
========================================================= */

window.MarketAnalyzer = {

  runAnalysis,

  getCandles,

  analyzeMarket

};
