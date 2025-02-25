/**
 * content.js
 *
 * Improved version that properly captures all interim results 
 * and ensures they make it to the final transcript.
 */

"use strict";

console.debug("🔵 [content.js] Trans-Crab content script with improved interim-capture ready.");

let recognition = null;
let isTranscribing = false;

// Stores all finalized chunks (with timestamps)
let transcriptChunks = [];

// Stores all interim results by resultIndex
let interimResults = {};

// Track when we last saved an interim result
let lastInterimSaveTime = 0;
const INTERIM_SAVE_INTERVAL = 3000; // Save interim results every 3 seconds

// Delay (ms) before sending final transcript after stop
const STOP_DELAY_MS = 5000;

/**
 * Start the transcription process.
 */
function startTranscription() {
  if (isTranscribing) {
    console.debug("🚫 [content.js] Already transcribing; ignoring start request.");
    return;
  }

  if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
    console.error("🚫 [content.js] Speech recognition is not supported in this browser.");
    return;
  }

  isTranscribing = true;
  transcriptChunks = [];
  interimResults = {};
  lastInterimSaveTime = Date.now();
  console.debug("🎤 [content.js] Starting transcription session...");

  try {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  } catch (err) {
    console.error("❌ [content.js] Failed to initialize SpeechRecognition:", err);
    return;
  }

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "he-IL"; // Hebrew

  recognition.onresult = (event) => {
    const now = Date.now();
    let hasNewInterim = false;

    // Process each result
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript.trim();

      if (result.isFinal) {
        // If final, push to transcriptChunks
        const timestamp = new Date().toLocaleTimeString();
        transcriptChunks.push(`[${timestamp}] ${text}`);
        console.debug(`✅ [content.js] Final result: "${text}" (stored as chunk)`);
        
        // Remove this index from interim results since it's now final
        delete interimResults[i];
      } else {
        // Store interim result by its index
        interimResults[i] = text;
        hasNewInterim = true;
        console.debug(`✏️ [content.js] Interim result at index ${i}: "${text}"`);
      }
    }

    // Periodically save interim results that haven't become final
    if (hasNewInterim && (now - lastInterimSaveTime) > INTERIM_SAVE_INTERVAL) {
      saveCurrentInterimResults();
      lastInterimSaveTime = now;
    }
  };

  recognition.onerror = (event) => {
    console.error("❌ [content.js] Speech recognition error:", event.error);
    // Save any interim results when an error occurs
    saveCurrentInterimResults();
  };

  recognition.onend = () => {
    console.warn("⚠️ [content.js] Speech recognition ended.");
    
    // Save any pending interim results when recognition ends
    saveCurrentInterimResults();
    
    // Auto-restart if user is still transcribing
    if (isTranscribing) {
      console.debug("🔄 [content.js] Restarting after onend...");
      try {
        recognition.start();
      } catch (err) {
        console.error("❌ [content.js] Error restarting SpeechRecognition:", err);
      }
    }
  };

  try {
    recognition.start();
    console.debug(`🚀 [content.js] Speech recognition started (lang="${recognition.lang}").`);
  } catch (err) {
    console.error("❌ [content.js] Failed to start SpeechRecognition:", err);
  }
}

/**
 * Save any current interim results to the transcript chunks.
 * This ensures we don't lose interim speech that never becomes final.
 */
function saveCurrentInterimResults() {
  if (Object.keys(interimResults).length === 0) return;
  
  // Combine all current interim results
  const combinedInterim = Object.values(interimResults).join(" ");
  
  if (combinedInterim.trim()) {
    const timestamp = new Date().toLocaleTimeString();
    transcriptChunks.push(`[${timestamp}] ${combinedInterim} [interim]`);
    console.debug(`🔄 [content.js] Saved interim results: "${combinedInterim}"`);
  }
}

/**
 * Stop the transcription process.
 */
function stopTranscription() {
  if (!isTranscribing) {
    console.debug("🚫 [content.js] No active transcription to stop.");
    return;
  }
  isTranscribing = false;
  console.debug("🛑 [content.js] Stopping transcription session...");

  // Save any pending interim results immediately
  saveCurrentInterimResults();

  try {
    recognition.stop();
  } catch (err) {
    console.error("❌ [content.js] Error stopping SpeechRecognition:", err);
  }

  // After a short delay, finalize the transcript
  setTimeout(() => {
    finalizeTranscript();
  }, STOP_DELAY_MS);
}

/**
 * Finalize and send the transcript.
 */
function finalizeTranscript() {
  // Save any remaining interim results one last time
  saveCurrentInterimResults();

  // Join all chunks
  const transcriptText = transcriptChunks.join("\n\n");
  console.debug("📤 [content.js] Final transcript ready:\n", transcriptText);

  // Send to background
  sendTranscriptToBackground(transcriptText);

  // Clear arrays
  transcriptChunks = [];
  interimResults = {};
}

/**
 * Sends the transcript to background.js for file download.
 */
function sendTranscriptToBackground(transcriptText) {
  if (!transcriptText.trim()) {
    console.warn("⚠️ [content.js] Transcript is empty => skipping download.");
    return;
  }
  console.debug("📨 [content.js] Sending transcript to background for download...");
  chrome.runtime.sendMessage({ action: "download_transcript", transcript: transcriptText }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ [content.js] Failed to send transcript:", chrome.runtime.lastError);
    } else {
      console.debug("✅ [content.js] Transcript sent to background successfully.");
    }
  });
}

/**
 * Creates and triggers the download of the transcript file (called by background.js).
 */
function createTranscriptFile(text) {
  console.debug("📂 [content.js] Creating transcript file for download...");
  const blob = new Blob([text], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meet_transcript_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  console.debug("✅ [content.js] Transcript file download initiated.");
}

/**
 * Listen for messages from popup.js.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.debug("📬 [content.js] Received message:", message);
  switch (message.action) {
    case "start_transcription":
      console.debug("🎤 [content.js] 'start_transcription' command received.");
      startTranscription();
      sendResponse({ status: "Started" });
      break;
    case "stop_transcription":
      console.debug("🛑 [content.js] 'stop_transcription' command received.");
      stopTranscription();
      sendResponse({ status: "Stopped" });
      break;
    case "ping":
      sendResponse({ status: "available" });
      break;
    case "download_transcript_content":
      createTranscriptFile(message.transcript);
      break;
    default:
      console.warn("⚠️ [content.js] Unrecognized message action:", message.action);
  }
});