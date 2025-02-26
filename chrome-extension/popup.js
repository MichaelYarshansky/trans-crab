// popup.js
// Manages the popup UI interactions and persistent transcription timer,
// and enables the start button only if the content script is injected.

console.debug("🔵 [popup.js] Loaded.");

let timerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  console.debug("📋 [popup.js] DOM fully loaded.");
  const transcribeBtn = document.getElementById("transcribe-btn");
  const statusText = document.getElementById("status");

  if (!transcribeBtn || !statusText) {
    console.error("❌ [popup.js] Missing transcribe button or status text.");
    return;
  }

  // Check if the content script is available on the active tab with retry mechanism
  checkContentScriptAvailability();

  // Toggle transcription on button click (only active if enabled)
  transcribeBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) {
        console.error("❌ [popup.js] No active tab found.");
        return;
      }
      const isActive = transcribeBtn.classList.contains("transcribing");
      const action = isActive ? "stop_transcription" : "start_transcription";
      console.debug(`🚀 [popup.js] Sending "${action}" message to content script.`);
      chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ [popup.js] Failed to send message:", chrome.runtime.lastError);
        } else if (response && response.status === "Started") {
          console.debug("✅ [popup.js] Transcription started.");
          chrome.storage.local.set({ transcriptionStartTime: Date.now() });
          startTimer();
          updateUI(true);
        } else if (response && response.status === "Stopped") {
          console.debug("✅ [popup.js] Transcription stopped.");
          stopTimer();
          chrome.storage.local.remove("transcriptionStartTime");
          updateUI(false);
        }
      });
    });
  });
});

// Checks if the content script is available on the active tab.
// Implements a retry mechanism in case the content script hasn't loaded yet.
function checkContentScriptAvailability(retryCount = 0) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) {
      disableButton();
      return;
    }
    let tab = tabs[0];
    // Check if URL is supported (Google Meet or Zoom)
    if (tab.url.includes("meet.google.com") || tab.url.includes("zoom.us")) {
      chrome.tabs.sendMessage(tab.id, { action: "ping" }, (response) => {
        if (chrome.runtime.lastError || !response || response.status !== "available") {
          if (retryCount < 2) {
            console.debug("🔄 [popup.js] Retry ping (attempt " + (retryCount + 1) + ").");
            setTimeout(() => checkContentScriptAvailability(retryCount + 1), 500);
          } else {
            console.debug("❌ [popup.js] Content script not available after retries.");
            disableButton();
          }
        } else {
          console.debug("✅ [popup.js] Content script available.");
          enableButton();
        }
      });
    } else {
      disableButton();
    }
  });
}

// Disable the transcribe button if content script isn't available
function disableButton() {
  const transcribeBtn = document.getElementById("transcribe-btn");
  const statusText = document.getElementById("status");
  transcribeBtn.textContent = "🦀: Zzz";
  transcribeBtn.disabled = true;
  transcribeBtn.classList.add("disabled");
  statusText.innerText = "Unsupported site";
}

// Enable the transcribe button and update UI based on saved state
function enableButton() {
  const transcribeBtn = document.getElementById("transcribe-btn");
  transcribeBtn.disabled = false;
  transcribeBtn.classList.remove("disabled");
  chrome.storage.local.get(["isTranscribing", "transcriptionStartTime"], (data) => {
    if (data.isTranscribing && data.transcriptionStartTime) {
      const elapsed = Math.floor((Date.now() - data.transcriptionStartTime) / 1000);
      updateTimerText(elapsed);
      updateUI(true);
      startTimer();
    } else {
      updateUI(false);
    }
  });
}

// Start the transcription timer using the stored transcriptionStartTime
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    chrome.storage.local.get("transcriptionStartTime", (data) => {
      if (data.transcriptionStartTime) {
        const elapsed = Math.floor((Date.now() - data.transcriptionStartTime) / 1000);
        updateTimerText(elapsed);
      }
    });
  }, 1000);
}

// Stop the transcription timer and reset display
function stopTimer() {
  console.debug("🛑 [popup.js] Stopping timer.");
  clearInterval(timerInterval);
  document.getElementById("status").innerText = "Not transcribing";
}

// Update the timer display text in MM:SS format
function updateTimerText(elapsedSeconds) {
  const min = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const sec = String(elapsedSeconds % 60).padStart(2, "0");
  document.getElementById("status").innerText = `Transcribing... ${min}:${sec}`;
}

// Update the UI button and state based on transcription status
function updateUI(isTranscribing) {
  const transcribeBtn = document.getElementById("transcribe-btn");
  if (isTranscribing) {
    transcribeBtn.textContent = "⏹️ Stop Transcribing";
    transcribeBtn.classList.add("transcribing");
    chrome.storage.local.set({ isTranscribing: true });
  } else {
    transcribeBtn.textContent = "▶️ Start Transcribing";
    transcribeBtn.classList.remove("transcribing");
    chrome.storage.local.set({ isTranscribing: false });
  }
}
