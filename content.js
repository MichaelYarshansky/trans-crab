/**
 * content.js
 *
 * This version stores both final results and the most recent interim result.
 * If the API never finalizes some speech, we still save that interim text
 * instead of losing it.
 */

"use strict";

console.debug("🔵 [content.js] Trans-Crab content script with interim-capture ready.");

let recognition = null;
let isTranscribing = false;

// Stores all finalized chunks (with timestamps)
let transcriptChunks = [];

// Stores the latest interim text in case it never becomes final
let currentInterim = "";

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
  currentInterim = "";
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
    // For each result (interim or final)
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript.trim();

      if (result.isFinal) {
        // If final, push to transcriptChunks and clear currentInterim
        const timestamp = new Date().toLocaleTimeString();
        transcriptChunks.push(`[${timestamp}] ${text}`);
        console.debug(`✅ [content.js] Final result: "${text}" (stored as chunk)`);
        currentInterim = ""; // Clear interim buffer
      } else {
        // If interim, store in currentInterim
        currentInterim = text;
        console.debug(`✏️ [content.js] Interim result: "${text}"`);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("❌ [content.js] Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.warn("⚠️ [content.js] Speech recognition ended.");
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
 * Stop the transcription process.
 */
function stopTranscription() {
  if (!isTranscribing) {
    console.debug("🚫 [content.js] No active transcription to stop.");
    return;
  }
  isTranscribing = false;
  console.debug("🛑 [content.js] Stopping transcription session...");

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
 * Finalize and send the transcript, including any leftover interim text.
 */
function finalizeTranscript() {
  // If there's leftover interim text, store it as a chunk
  if (currentInterim.trim()) {
    const timestamp = new Date().toLocaleTimeString();
    transcriptChunks.push(`[${timestamp}] ${currentInterim}`);
    console.debug(`🔎 [content.js] Capturing leftover interim text: "${currentInterim}"`);
    currentInterim = "";
  }

  // Join all chunks
  const transcriptText = transcriptChunks.join("\n\n");
  console.debug("📤 [content.js] Final transcript ready:\n", transcriptText);

  // Send to background
  sendTranscriptToBackground(transcriptText);

  // Clear arrays
  transcriptChunks = [];
  currentInterim = "";
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
