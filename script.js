/* =========================================================
   AI MARKET ANALYZER
   script.js
========================================================= */

"use strict";


/* =========================================================
   GLOBAL SETTINGS
========================================================= */

const APP = {
  analysisDuration: 6500,
  maxFileSize: 10 * 1024 * 1024,
  allowedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg"
  ]
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   DOM ELEMENTS
========================================================= */

const appLoader = $("#appLoader");

const menuButton = $("#menuButton");
const sideMenu = $("#sideMenu");
const closeMenu = $("#closeMenu");
const menuOverlay = $("#menuOverlay");

const pages = $$(".page");
const menuItems = $$(".menu-item");
const pageTargetButtons = $$("[data-page-target]");

const toast = $("#toast");
const toastTitle = $("#toastTitle");
const toastMessage = $("#toastMessage");
const toastClose = $("#toastClose");

const engineStatus = $("#engineStatus");


/* =========================================================
   APP INITIALIZATION
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
   APP LOADER
========================================================= */

function initializeLoader() {

  window.setTimeout(() => {

    if (!appLoader) return;

    appLoader.classList.add("hide");

    window.setTimeout(() => {
      appLoader.remove();
    }, 800);

  }, 900);

}


/* =========================================================
   MENU
========================================================= */

function initializeMenu() {

  if (menuButton) {
    menuButton.addEventListener("click", () => {

      const isOpen = sideMenu.classList.contains("open");

      if (isOpen) {
        closeSideMenu();
      } else {
        openSideMenu();
      }

    });
  }


  if (closeMenu) {
    closeMenu.addEventListener("click", closeSideMenu);
  }


  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeSideMenu);
  }


  document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
      closeSideMenu();
    }

  });

}


function openSideMenu() {

  if (!sideMenu) return;

  sideMenu.classList.add("open");

  if (menuOverlay) {
    menuOverlay.classList.add("show");
  }

  if (menuButton) {
    menuButton.classList.add("active");
    menuButton.setAttribute("aria-expanded", "true");
  }

}


function closeSideMenu() {

  if (!sideMenu) return;

  sideMenu.classList.remove("open");

  if (menuOverlay) {
    menuOverlay.classList.remove("show");
  }

  if (menuButton) {
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
  }

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

  menuItems.forEach((item) => {

    item.addEventListener("click", () => {

      const pageId = item.dataset.page;

      if (!pageId) return;

      menuItems.forEach((menuItem) => {
        menuItem.classList.remove("active");
      });

      item.classList.add("active");

      showPage(pageId);

      closeSideMenu();

    });

  });


  pageTargetButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const pageId = button.dataset.pageTarget;

      if (!pageId) return;

      showPage(pageId);

      updateActiveMenu(pageId);

    });

  });


  /* Dashboard cards */

  $$(".dashboard-card").forEach((card) => {

    card.addEventListener("click", () => {

      const title = card.querySelector("h3");

      if (!title) return;

      const text = title.textContent.toLowerCase();

      if (text.includes("real")) {
        showPage("realAnalysisPage");
        updateActiveMenu("realAnalysisPage");
      }

      else if (text.includes("otc")) {
        showPage("otcAnalysisPage");
        updateActiveMenu("otcAnalysisPage");
      }

      else if (text.includes("future")) {
        showPage("futureSignalsPage");
        updateActiveMenu("futureSignalsPage");
      }

    });

  });

}


function showPage(pageId) {

  const targetPage = document.getElementById(pageId);

  if (!targetPage) return;


  pages.forEach((page) => {
    page.classList.remove("active-page");
  });


  /*
    Force browser to restart page animation.
  */

  targetPage.classList.remove("active-page");

  void targetPage.offsetWidth;

  targetPage.classList.add("active-page");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function updateActiveMenu(pageId) {

  menuItems.forEach((item) => {

    item.classList.toggle(
      "active",
      item.dataset.page === pageId
    );

  });

}


/* =========================================================
   FILE VALIDATION
========================================================= */

function validateImageFile(file) {

  if (!file) {
    return {
      valid: false,
      message: "Please select an image."
    };
  }


  if (!APP.allowedImageTypes.includes(file.type)) {

    return {
      valid: false,
      message: "Please upload JPG, PNG or WEBP image."
    };

  }


  if (file.size > APP.maxFileSize) {

    return {
      valid: false,
      message: "Image size must be below 10 MB."
    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   IMAGE PREVIEW HELPER
========================================================= */

function createImagePreview(
  file,
  previewBox,
  previewImage,
  fileNameElement
) {

  const validation = validateImageFile(file);

  if (!validation.valid) {

    showToast(
      "Invalid Image",
      validation.message,
      "error"
    );

    return false;
  }


  const imageURL = URL.createObjectURL(file);

  previewImage.src = imageURL;

  previewBox.classList.remove("hidden");

  fileNameElement.textContent = file.name;


  previewImage.onload = () => {
    URL.revokeObjectURL(imageURL);
  };


  return true;

}


/* =========================================================
   REAL MARKET ANALYSIS
========================================================= */

function initializeRealAnalysis() {

  const input = $("#realChartInput");

  const previewBox = $("#realPreviewBox");
  const previewImage = $("#realPreviewImage");
  const fileName = $("#realFileName");

  const removeButton = $("#removeRealImage");

  if (!input) return;


  input.addEventListener("change", () => {

    const file = input.files[0];

    if (!file) return;


    const success = createImagePreview(
      file,
      previewBox,
      previewImage,
      fileName
    );


    if (!success) {

      input.value = "";

      return;

    }


    showToast(
      "Chart Ready",
      "Starting AI chart analysis...",
      "success"
    );


    /*
      Start analysis automatically
      after image upload.
    */

    startAnalysis({
      type: "real",
      input,
      progressBox: $("#realAnalysisProgress"),
      progressFill: $("#realProgressFill"),
      percentElement: $("#realAnalysisPercent"),
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


  if (removeButton) {

    removeButton.addEventListener("click", () => {

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

}


/* =========================================================
   OTC MARKET ANALYSIS
========================================================= */

function initializeOtcAnalysis() {

  const input = $("#otcChartInput");

  const previewBox = $("#otcPreviewBox");
  const previewImage = $("#otcPreviewImage");
  const fileName = $("#otcFileName");

  const removeButton = $("#removeOtcImage");

  if (!input) return;


  input.addEventListener("change", () => {

    const file = input.files[0];

    if (!file) return;


    const success = createImagePreview(
      file,
      previewBox,
      previewImage,
      fileName
    );


    if (!success) {

      input.value = "";

      return;

    }


    showToast(
      "OTC Chart Ready",
      "Starting OTC analysis...",
      "success"
    );


    startAnalysis({
      type: "otc",
      input,
      progressBox: $("#otcAnalysisProgress"),
      progressFill: $("#otcProgressFill"),
      percentElement: $("#otcAnalysisPercent"),
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


  if (removeButton) {

    removeButton.addEventListener("click", () => {

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

}


/* =========================================================
   ANALYSIS ENGINE
========================================================= */

function startAnalysis(options) {

  const {
    input,
    progressBox,
    progressFill,
    percentElement,
    steps,
    resultBox
  } = options;


  if (!progressBox || !resultBox) return;


  /*
    Hide previous result.
  */

  resultBox.classList.add("hidden");


  /*
    Reset progress.
  */

  progressBox.classList.remove("hidden");

  if (progressFill) {
    progressFill.style.width = "0%";
  }

  if (percentElement) {
    percentElement.textContent = "0%";
  }


  steps.forEach((step) => {

    step.classList.remove("active");
    step.classList.remove("done");

  });


  /*
    Disable input during analysis.
  */

  if (input) {
    input.disabled = true;
  }


  if (engineStatus) {
    engineStatus.textContent = "Analyzing...";
  }


  const startTime = performance.now();

  let currentStep = -1;


  const stepInterval =
    APP.analysisDuration / steps.length;


  const progressInterval = 100;


  let elapsed = 0;


  /*
    Progress animation.
  */

  const progressTimer = window.setInterval(() => {

    elapsed += progressInterval;

    const percent = Math.min(
      100,
      Math.round(
        (elapsed / APP.analysisDuration) * 100
      )
    );


    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }


    if (percentElement) {
      percentElement.textContent = `${percent}%`;
    }


    const newStep = Math.min(
      steps.length - 1,
      Math.floor(
        elapsed / stepInterval
      )
    );


    if (
      newStep !== currentStep &&
      newStep >= 0
    ) {

      /*
        Previous step becomes done.
      */

      if (currentStep >= 0) {

        steps[currentStep]
          .classList.remove("active");

        steps[currentStep]
          .classList.add("done");

        const previousIcon =
          steps[currentStep].querySelector("span");

        if (previousIcon) {
          previousIcon.textContent = "✓";
        }

      }


      currentStep = newStep;

      steps[currentStep]
        .classList.add("active");

      const activeIcon =
        steps[currentStep].querySelector("span");

      if (activeIcon) {
        activeIcon.textContent = "◉";
      }

    }


    if (elapsed >= APP.analysisDuration) {

      window.clearInterval(progressTimer);

      finishAnalysis(options, startTime);

    }

  }, progressInterval);

}


/* =========================================================
   FINISH ANALYSIS
========================================================= */

function finishAnalysis(options, startTime) {

  const {
    input,
    progressBox,
    progressFill,
    percentElement,
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


  /*
    Complete progress.
  */

  if (progressFill) {
    progressFill.style.width = "100%";
  }

  if (percentElement) {
    percentElement.textContent = "100%";
  }


  steps.forEach((step) => {

    step.classList.remove("active");

    step.classList.add("done");

    const icon = step.querySelector("span");

    if (icon) {
      icon.textContent = "✓";
    }

  });


  /*
    Small delay for polished UI.
  */

  window.setTimeout(() => {

    progressBox.classList.add("hidden");


    /*
      DEMO RESULT
      -----------------------------------------
      This is not a real market prediction.
      It will later be replaced with API data.
    */

    const result = generateDemoAnalysis();


    /*
      Signal
    */

    applySignal(
      signalElement,
      signalText,
      result.direction
    );


    /*
      Details
    */

    if (confidence) {
      confidence.textContent =
        `${result.confidence}%`;
    }


    if (confidenceFill) {

      confidenceFill.style.width =
        `${result.confidence}%`;

    }


    if (trend) {
      trend.textContent = result.trend;
    }


    if (pattern) {
      pattern.textContent = result.pattern;
    }


    if (momentum) {
      momentum.textContent = result.momentum;
    }


    /*
      Analysis duration.
    */

    const duration =
      (
        (performance.now() - startTime) /
        1000
      ).toFixed(1);


    if (resultTime) {
      resultTime.textContent =
        `${duration}s`;
    }


    /*
      Show result.
    */

    resultBox.classList.remove("hidden");


    /*
      Enable upload again.
    */

    if (input) {
      input.disabled = false;
    }


    if (engineStatus) {
      engineStatus.textContent = "Ready";
    }


    showToast(
      "Analysis Complete",
      `${result.direction} signal generated.`,
      "success"
    );


  }, 350);

}


/* =========================================================
   DEMO ANALYSIS RESULT
========================================================= */

function generateDemoAnalysis() {

  const directions = [
    "UP",
    "DOWN"
  ];


  const patterns = [
    "Breakout",
    "Engulfing",
    "Support Bounce",
    "Resistance Reject",
    "Trend Continuation",
    "Consolidation"
  ];


  const trends = [
    "Bullish",
    "Bearish",
    "Sideways"
  ];


  const momentumList = [
    "Strong",
    "Moderate",
    "Weak"
  ];


  const direction =
    directions[
      Math.floor(
        Math.random() * directions.length
      )
    ];


  const confidence =
    Math.floor(
      72 + Math.random() * 24
    );


  return {

    direction,

    confidence,

    trend:
      trends[
        Math.floor(
          Math.random() * trends.length
        )
      ],

    pattern:
      patterns[
        Math.floor(
          Math.random() * patterns.length
        )
      ],

    momentum:
      momentumList[
        Math.floor(
          Math.random() * momentumList.length
        )
      ]

  };

}


/* =========================================================
   APPLY UP / DOWN SIGNAL
========================================================= */

function applySignal(
  signalElement,
  signalText,
  direction
) {

  if (!signalElement || !signalText) {
    return;
  }


  signalElement.classList.remove("down");


  const icon =
    signalElement.querySelector(".signal-icon");


  if (direction === "DOWN") {

    signalElement.classList.add("down");

    signalText.textContent = "DOWN";

    if (icon) {
      icon.textContent = "↓";
    }

  }

  else {

    signalText.textContent = "UP";

    if (icon) {
      icon.textContent = "↑";
    }

  }


  /*
    Restart animation.
  */

  signalElement.style.animation = "none";

  void signalElement.offsetWidth;

  signalElement.style.animation = "";

}


/* =========================================================
   RESET ANALYSIS
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


  if (previewBox) {
    previewBox.classList.add("hidden");
  }


  if (progressBox) {
    progressBox.classList.add("hidden");
  }


  if (resultBox) {
    resultBox.classList.add("hidden");
  }


  if (engineStatus) {
    engineStatus.textContent = "Ready";
  }

}


/* =========================================================
   FUTURE SIGNALS
========================================================= */

function initializeFutureSignals() {

  const marketSelect = $("#marketSelect");
  const generateButton = $("#generateSignalsButton");

  const loadingBox = $("#signalLoading");
  const signalsContainer = $("#signalsContainer");

  const signalList = $("#signalList");
  const selectedMarketName = $("#selectedMarketName");


  if (!marketSelect || !generateButton) {
    return;
  }


  generateButton.addEventListener("click", () => {

    const market = marketSelect.value;


    if (!market) {

      showToast(
        "Select Market",
        "Please select a market first.",
        "error"
      );

      marketSelect.focus();

      return;

    }


    /*
      Hide old signals.
    */

    signalsContainer.classList.add("hidden");


    /*
      Show loading.
    */

    loadingBox.classList.remove("hidden");

    generateButton.disabled = true;

    generateButton.style.opacity = "0.55";


    /*
      Simulated generation time.
    */

    window.setTimeout(() => {

      const signals =
        generateFutureSignals(market, 10);


      if (signalList) {
        signalList.innerHTML = "";
      }


      if (selectedMarketName) {
        selectedMarketName.textContent =
          `${market} Signals`;
      }


      signals.forEach(
        (signal, index) => {

          createSignalCard(
            signal,
            index,
            signalList
          );

        }
      );


      loadingBox.classList.add("hidden");

      signalsContainer.classList.remove("hidden");

      generateButton.disabled = false;

      generateButton.style.opacity = "1";


      showToast(
        "Signals Ready",
        "10 signal ideas generated.",
        "success"
      );


    }, 1800);

  });

}


/* =========================================================
   GENERATE FUTURE SIGNALS
========================================================= */

function generateFutureSignals(
  market,
  amount
) {

  const result = [];

  const now = new Date();


  for (let i = 0; i < amount; i++) {

    const direction =
      Math.random() > 0.5
        ? "UP"
        : "DOWN";


    const confidence =
      Math.floor(
        70 + Math.random() * 27
      );


    const signalTime =
      new Date(
        now.getTime() +
        ((i + 1) * 2 * 60 * 1000)
      );


    result.push({

      market,

      direction,

      confidence,

      time: formatTime(signalTime)

    });

  }


  return result;

}


/* =========================================================
   CREATE SIGNAL CARD
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


  const number =
    String(index + 1).padStart(2, "0");


  const directionClass =
    signal.direction === "UP"
      ? "up"
      : "down";


  card.innerHTML = `

    <div class="signal-number">
      ${number}
    </div>

    <div class="future-signal-market">

      <strong>
        ${escapeHTML(signal.market)}
      </strong>

      <small>
        Confidence ${signal.confidence}%
      </small>

    </div>

    <div class="signal-time">
      ${signal.time}
    </div>

    <div class="direction ${directionClass}">
      ${signal.direction === "UP" ? "↑ UP" : "↓ DOWN"}
    </div>

  `;


  container.appendChild(card);

}


/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(date) {

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


/* =========================================================
   HTML ESCAPE
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

  if (toastClose) {

    toastClose.addEventListener(
      "click",
      hideToast
    );

  }

}


function showToast(
  title,
  message,
  type = "success"
) {

  if (!toast) return;


  if (toastTitle) {
    toastTitle.textContent = title;
  }


  if (toastMessage) {
    toastMessage.textContent = message;
  }


  const icon =
    toast.querySelector(".toast-icon");


  if (icon) {

    if (type === "error") {

      icon.textContent = "×";

      icon.style.color =
        "var(--red)";

      icon.style.background =
        "rgba(255,64,92,0.08)";

    }

    else {

      icon.textContent = "✓";

      icon.style.color =
        "var(--green)";

      icon.style.background =
        "rgba(0,230,118,0.08)";

    }

  }


  toast.classList.add("show");


  window.clearTimeout(
    window.__toastTimer
  );


  window.__toastTimer =
    window.setTimeout(
      hideToast,
      3500
    );

}


function hideToast() {

  if (!toast) return;

  toast.classList.remove("show");

}


/* =========================================================
   PREVENT DRAGGING IMAGES
========================================================= */

document.addEventListener(
  "dragstart",
  (event) => {

    if (
      event.target &&
      event.target.tagName === "IMG"
    ) {
      event.preventDefault();
    }

  }
);


/* =========================================================
   HANDLE PAGE VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (document.hidden) {

      if (engineStatus) {
        engineStatus.textContent =
          "Paused";
      }

    }

    else {

      if (engineStatus) {
        engineStatus.textContent =
          "Ready";
      }

    }

  }
);


/* =========================================================
   CONSOLE
========================================================= */

console.log(
  "%c AI Market Analyzer ",
  "background:#071321;color:#00e5ff;font-weight:bold;padding:8px;"
);

console.log(
  "Frontend initialized successfully."
);
