"use strict";

/* =========================================================
   AI MARKET ANALYZER — FINAL
   No random/demo signal
   Screenshot -> Backend -> Twelve Data -> Analysis
========================================================= */

const APP = {
  analysisTimeout: 10000,
  maxFileSize: 10 * 1024 * 1024,
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
  ],

  /* Backend endpoint */
  apiEndpoint: "/api/analyze-chart"
};


/* =========================================================
   HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeLoader();
  initializeMenu();
  initializeNavigation();

  initializeRealAnalysis();
  initializeOtcAnalysis();

  initializeFutureSignals();

  initializeToast();

});


/* =========================================================
   LOADER
========================================================= */

function initializeLoader() {

  const loader = $("#appLoader");

  if (!loader) return;

  setTimeout(() => {

    loader.classList.add("hide");

    setTimeout(() => {
      loader.remove();
    }, 700);

  }, 700);

}


/* =========================================================
   MENU
========================================================= */

function initializeMenu() {

  const menuButton = $("#menuButton");
  const sideMenu = $("#sideMenu");
  const closeMenu = $("#closeMenu");
  const overlay = $("#menuOverlay");

  if (menuButton) {

    menuButton.addEventListener("click", () => {

      sideMenu?.classList.toggle("open");
      overlay?.classList.toggle("show");
      menuButton.classList.toggle("active");

    });

  }


  if (closeMenu) {
    closeMenu.addEventListener("click", closeMenuPanel);
  }


  if (overlay) {
    overlay.addEventListener("click", closeMenuPanel);
  }


  document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
      closeMenuPanel();
    }

  });

}


function closeMenuPanel() {

  $("#sideMenu")?.classList.remove("open");
  $("#menuOverlay")?.classList.remove("show");
  $("#menuButton")?.classList.remove("active");

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

  $$(".menu-item").forEach((item) => {

    item.addEventListener("click", () => {

      const page = item.dataset.page;

      if (!page) return;

      showPage(page);

      $$(".menu-item").forEach((x) => {
        x.classList.remove("active");
      });

      item.classList.add("active");

      closeMenuPanel();

    });

  });


  $$("[data-page-target]").forEach((button) => {

    button.addEventListener("click", () => {

      const page = button.dataset.pageTarget;

      if (page) {
        showPage(page);
      }

    });

  });

}


function showPage(pageId) {

  const page = document.getElementById(pageId);

  if (!page) return;

  $$(".page").forEach((p) => {
    p.classList.remove("active-page");
  });

  page.classList.remove("active-page");

  void page.offsetWidth;

  page.classList.add("active-page");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   FILE VALIDATION
========================================================= */

function validateImage(file) {

  if (!file) {

    return {
      valid: false,
      message: "Please select a chart screenshot."
    };

  }


  if (!APP.allowedTypes.includes(file.type)) {

    return {
      valid: false,
      message: "Only JPG, PNG or WEBP images are supported."
    };

  }


  if (file.size > APP.maxFileSize) {

    return {
      valid: false,
      message: "Image must be smaller than 10 MB."
    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   PREVIEW
========================================================= */

function showPreview(
  file,
  previewBox,
  previewImage,
  fileName
) {

  const check = validateImage(file);

  if (!check.valid) {

    showToast(
      "Invalid Image",
      check.message,
      "error"
    );

    return false;

  }


  const url = URL.createObjectURL(file);

  if (previewImage) {
    previewImage.src = url;
  }

  if (fileName) {
    fileName.textContent = file.name;
  }

  previewBox?.classList.remove("hidden");


  if (previewImage) {

    previewImage.onload = () => {
      URL.revokeObjectURL(url);
    };

  }


  return true;

}


/* =========================================================
   REAL MARKET
========================================================= */

function initializeRealAnalysis() {

  const input = $("#realChartInput");

  if (!input) return;


  const previewBox = $("#realPreviewBox");
  const previewImage = $("#realPreviewImage");
  const fileName = $("#realFileName");

  const removeButton = $("#removeRealImage");


  input.addEventListener("change", async () => {

    const file = input.files?.[0];

    if (!file) return;


    const valid = showPreview(
      file,
      previewBox,
      previewImage,
      fileName
    );


    if (!valid) {

      input.value = "";

      return;

    }


    await analyzeChart({

      mode: "real",

      file,

      input,

      progressBox: $("#realAnalysisProgress"),
      progressFill: $("#realProgressFill"),
      progressPercent: $("#realAnalysisPercent"),
      steps: $$("#realAnalysisSteps .analysis-step"),

      resultBox: $("#realResultBox"),

      signalElement: $("#realSignal"),
      signalText: $("#realSignalText"),

      resultTime: $("#realResultTime"),

      confidence: $("#realConfidence"),
      confidenceFill: $("#realConfidenceFill"),

      trend: $("#realTrend"),
      pattern: $("#realPattern"),
      momentum: $("#realMomentum")

    });

  });


  removeButton?.addEventListener("click", () => {

    resetAnalysis({
      input,
      previewBox,
      previewImage,
      fileName,
      progressBox: $("#realAnalysisProgress"),
      resultBox: $("#realResultBox")
    });

  });

}


/* =========================================================
   OTC MARKET
========================================================= */

function initializeOtcAnalysis() {

  const input = $("#otcChartInput");

  if (!input) return;


  const previewBox = $("#otcPreviewBox");
  const previewImage = $("#otcPreviewImage");
  const fileName = $("#otcFileName");

  const removeButton = $("#removeOtcImage");


  input.addEventListener("change", async () => {

    const file = input.files?.[0];

    if (!file) return;


    const valid = showPreview(
      file,
      previewBox,
      previewImage,
      fileName
    );


    if (!valid) {

      input.value = "";

      return;

    }


    await analyzeChart({

      mode: "otc",

      file,

      input,

      progressBox: $("#otcAnalysisProgress"),
      progressFill: $("#otcProgressFill"),
      progressPercent: $("#otcAnalysisPercent"),
      steps: $$("#otcAnalysisSteps .analysis-step"),

      resultBox: $("#otcResultBox"),

      signalElement: $("#otcSignal"),
      signalText: $("#otcSignalText"),

      resultTime: $("#otcResultTime"),

      confidence: $("#otcConfidence"),
      confidenceFill: $("#otcConfidenceFill"),

      trend: $("#otcTrend"),
      pattern: $("#otcPattern"),
      momentum: $("#otcMomentum")

    });

  });


  removeButton?.addEventListener("click", () => {

    resetAnalysis({
      input,
      previewBox,
      previewImage,
      fileName,
      progressBox: $("#otcAnalysisProgress"),
      resultBox: $("#otcResultBox")
    });

  });

}


/* =========================================================
   REAL ANALYSIS
========================================================= */

async function analyzeChart(options) {

  const {
    mode,
    file,
    input,
    progressBox,
    progressFill,
    progressPercent,
    steps,
    resultBox,
    signalElement,
    signalText,
    resultTime,
    confidence,
    confidenceFill,
    trend,
    pattern,
    momentum
  } = options;


  if (!file) return;


  /*
    Reset UI
  */

  resultBox?.classList.add("hidden");

  progressBox?.classList.remove("hidden");


  if (progressFill) {
    progressFill.style.width = "0%";
  }

  if (progressPercent) {
    progressPercent.textContent = "0%";
  }


  steps.forEach((step) => {

    step.classList.remove("active");
    step.classList.remove("done");

  });


  if (input) {
    input.disabled = true;
  }


  const startTime = performance.now();


  /*
    Animated analysis steps
  */

  const stepMessages = [
    "Reading chart...",
    "Checking candles...",
    "Checking trend...",
    "Checking support/resistance...",
    "Checking momentum...",
    "Fetching market data...",
    "Calculating indicators..."
  ];


  let stepIndex = 0;


  const stepTimer = setInterval(() => {

    if (stepIndex >= steps.length) {

      clearInterval(stepTimer);

      return;

    }


    if (stepIndex > 0) {

      steps[stepIndex - 1]
        .classList.remove("active");

      steps[stepIndex - 1]
        .classList.add("done");

      const oldIcon =
        steps[stepIndex - 1]
          .querySelector("span");

      if (oldIcon) {
        oldIcon.textContent = "✓";
      }

    }


    steps[stepIndex]
      .classList.add("active");


    const icon =
      steps[stepIndex]
        .querySelector("span");

    if (icon) {
      icon.textContent = "◉";
    }


    if (progressPercent) {

      const percent = Math.min(
        85,
        Math.round(
          ((stepIndex + 1) /
            Math.max(steps.length, 1)) * 85
        )
      );

      progressPercent.textContent =
        `${percent}%`;

      if (progressFill) {
        progressFill.style.width =
          `${percent}%`;
      }

    }


    stepIndex++;

  }, 650);


  /*
    Send screenshot to backend.
  */

  const formData = new FormData();

  formData.append("chart", file);
  formData.append("mode", mode);


  try {

    const controller =
      new AbortController();


    const timeout =
      setTimeout(() => {
        controller.abort();
      }, APP.analysisTimeout);


    const response = await fetch(
      APP.apiEndpoint,
      {
        method: "POST",
        body: formData,
        signal: controller.signal
      }
    );


    clearTimeout(timeout);


    const data =
      await response.json();


    clearInterval(stepTimer);


    /*
      Finish steps
    */

    steps.forEach((step) => {

      step.classList.remove("active");
      step.classList.add("done");

      const icon =
        step.querySelector("span");

      if (icon) {
        icon.textContent = "✓";
      }

    });


    if (progressFill) {
      progressFill.style.width = "100%";
    }


    if (progressPercent) {
      progressPercent.textContent = "100%";
    }


    /*
      API error
    */

    if (!response.ok || data.error) {

      throw new Error(
        data.error ||
        "Analysis failed."
      );

    }


    /*
      IMPORTANT:
      No random fallback.
      If backend doesn't return a real
      signal, we show an error instead.
    */

    if (
      !data.signal ||
      !["UP", "DOWN"].includes(
        String(data.signal).toUpperCase()
      )
    ) {

      throw new Error(
        "The server did not return a valid market signal."
      );

    }


    /*
      Display actual server result
    */

    const signal =
      String(data.signal).toUpperCase();


    applySignal(
      signalElement,
      signalText,
      signal
    );


    if (confidence) {

      const value =
        Number(data.confidence);

      confidence.textContent =
        Number.isFinite(value)
          ? `${Math.round(value)}%`
          : "--";

    }


    if (confidenceFill) {

      const value =
        Number(data.confidence);

      confidenceFill.style.width =
        Number.isFinite(value)
          ? `${Math.max(
              0,
              Math.min(100, value)
            )}%`
          : "0%";

    }


    if (trend) {
      trend.textContent =
        data.trend || "Unavailable";
    }


    if (pattern) {
      pattern.textContent =
        data.pattern || "Unavailable";
    }


    if (momentum) {
      momentum.textContent =
        data.momentum || "Unavailable";
    }


    const seconds =
      (
        (performance.now() - startTime) /
        1000
      ).toFixed(1);


    if (resultTime) {

      resultTime.textContent =
        data.analysisTime
          ? `${data.analysisTime}s`
          : `${seconds}s`;

    }


    resultBox?.classList.remove("hidden");


    showToast(
      "Analysis Complete",
      `${signal} analysis received from server.`,
      "success"
    );


  }

  catch (error) {

    clearInterval(stepTimer);


    resultBox?.classList.add("hidden");


    let message =
      error?.message ||
      "Unable to analyze the chart.";


    if (error?.name === "AbortError") {

      message =
        "Analysis took longer than 10 seconds.";

    }


    showToast(
      "Analysis Failed",
      message,
      "error"
    );


    console.error(
      "Chart analysis error:",
      error
    );

  }


  finally {

    if (input) {
      input.disabled = false;
    }

    progressBox?.classList.add("hidden");

  }

}


/* =========================================================
   SIGNAL UI
========================================================= */

function applySignal(
  signalElement,
  signalText,
  direction
) {

  if (!signalElement) return;


  signalElement.classList.remove("down");


  const icon =
    signalElement.querySelector(
      ".signal-icon"
    );


  if (direction === "DOWN") {

    signalElement.classList.add("down");

    if (signalText) {
      signalText.textContent = "DOWN";
    }

    if (icon) {
      icon.textContent = "↓";
    }

  }

  else {

    if (signalText) {
      signalText.textContent = "UP";
    }

    if (icon) {
      icon.textContent = "↑";
    }

  }


  /*
    Restart animation
  */

  signalElement.style.animation = "none";

  void signalElement.offsetWidth;

  signalElement.style.animation = "";

}


/* =========================================================
   RESET
========================================================= */

function resetAnalysis(options) {

  const {
    input,
    previewBox,
    previewImage,
    fileName,
    progressBox,
    resultBox
  } = options;


  if (input) {
    input.value = "";
    input.disabled = false;
  }


  if (previewImage) {
    previewImage.src = "";
  }


  if (fileName) {
    fileName.textContent =
      "No image selected";
  }


  previewBox?.classList.add("hidden");
  progressBox?.classList.add("hidden");
  resultBox?.classList.add("hidden");

}


/* =========================================================
   FUTURE SIGNALS
========================================================= */

function initializeFutureSignals() {

  const marketSelect =
    $("#marketSelect");

  const button =
    $("#generateSignalsButton");

  const loading =
    $("#signalLoading");

  const container =
    $("#signalsContainer");

  const list =
    $("#signalList");

  const marketName =
    $("#selectedMarketName");


  if (!marketSelect || !button) {
    return;
  }


  button.addEventListener("click", async () => {

    const market =
      marketSelect.value;


    if (!market) {

      showToast(
        "Select Market",
        "Please select a market first.",
        "error"
      );

      return;

    }


    button.disabled = true;

    loading?.classList.remove("hidden");
    container?.classList.add("hidden");


    try {

      /*
        Future signals should also come
        from backend/Twelve Data analysis.
      */

      const response = await fetch(
        "/api/future-signals",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            market,
            count: 10
          })
        }
      );


      const data =
        await response.json();


      if (!response.ok || data.error) {

        throw new Error(
          data.error ||
          "Unable to generate signals."
        );

      }


      if (!Array.isArray(data.signals)) {

        throw new Error(
          "Server returned invalid signals."
        );

      }


      if (list) {
        list.innerHTML = "";
      }


      if (marketName) {
        marketName.textContent =
          `${market} Signals`;
      }


      data.signals
        .slice(0, 10)
        .forEach((signal, index) => {

          createSignalCard(
            signal,
            index,
            list
          );

        });


      container?.classList.remove("hidden");


      showToast(
        "Signals Ready",
        "Live analysis signals received.",
        "success"
      );

    }

    catch (error) {

      console.error(error);

      showToast(
        "Signal Error",
        error.message ||
        "Unable to generate signals.",
        "error"
      );

    }

    finally {

      loading?.classList.add("hidden");

      button.disabled = false;

    }

  });

}


/* =========================================================
   FUTURE SIGNAL CARD
========================================================= */

function createSignalCard(
  signal,
  index,
  container
) {

  if (!container) return;


  const card =
    document.createElement("div");


  card.className =
    "future-signal-card";


  card.style.animationDelay =
    `${index * 80}ms`;


  const direction =
    String(
      signal.direction ||
      signal.signal ||
      ""
    ).toUpperCase();


  const directionClass =
    direction === "UP"
      ? "up"
      : "down";


  const directionIcon =
    direction === "UP"
      ? "↑ UP"
      : "↓ DOWN";


  card.innerHTML = `

    <div class="signal-number">
      ${String(index + 1).padStart(2, "0")}
    </div>

    <div class="future-signal-market">

      <strong>
        ${escapeHTML(
          signal.market || ""
        )}
      </strong>

      <small>
        Confidence ${
          Number.isFinite(
            Number(signal.confidence)
          )
            ? Math.round(
                Number(signal.confidence)
              ) + "%"
            : "--"
        }
      </small>

    </div>

    <div class="signal-time">
      ${escapeHTML(
        signal.time || "--:--"
      )}
    </div>

    <div class="direction ${directionClass}">
      ${directionIcon}
    </div>

  `;


  container.appendChild(card);

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

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

  const toast = $("#toast");

  if (!toast) return;


  const titleElement =
    $("#toastTitle");

  const messageElement =
    $("#toastMessage");


  if (titleElement) {
    titleElement.textContent = title;
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


  toast.classList.add("show");


  clearTimeout(
    window.__marketToastTimer
  );


  window.__marketToastTimer =
    setTimeout(
      hideToast,
      3500
    );

}


function hideToast() {

  $("#toast")?.classList.remove("show");

}


/* =========================================================
   IMAGE DRAG PROTECTION
========================================================= */

document.addEventListener(
  "dragstart",
  (event) => {

    if (
      event.target?.tagName === "IMG"
    ) {
      event.preventDefault();
    }

  }
);


/* =========================================================
   STARTUP
========================================================= */

console.log(
  "%c AI Market Analyzer — LIVE API MODE ",
  "background:#071321;color:#00e5ff;font-weight:bold;padding:8px;"
);

console.log(
  "Random/demo signals are disabled."
);

console.log(
  "Chart analysis endpoint:",
  APP.apiEndpoint
);
