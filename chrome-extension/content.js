/**
 * content.js
 *
 * Improved version that properly captures all interim results 
 * and ensures they make it to the final transcript.
 *
 * Now it extracts meeting metadata from the page:
 * - Meeting name: first attempts to get it from an element with class "u6vdEc", then falls back to other selectors, and finally prompts the user if not found.
 * - Participants: extracted solely from elements with the class "zWGUib".
 *
 * The transcript and metadata are sent to the backend for storage.
 */

"use strict";

console.debug("🔵 [content.js] Trans-Crab content script with improved interim-capture and metadata extraction ready.");

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
        const timestamp = new Date().toLocaleTimeString();
        transcriptChunks.push(`[${timestamp}] ${text}`);
        console.debug(`✅ [content.js] Final result: "${text}" (stored as chunk)`);
        delete interimResults[i];
      } else {
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
  saveCurrentInterimResults();

  try {
    recognition.stop();
  } catch (err) {
    console.error("❌ [content.js] Error stopping SpeechRecognition:", err);
  }

  setTimeout(() => {
    finalizeTranscript();
  }, STOP_DELAY_MS);
}

/**
 * Finalize and send the transcript.
 */
function finalizeTranscript() {
  saveCurrentInterimResults();
  const transcriptText = transcriptChunks.join("\n\n");
  console.debug("📤 [content.js] Final transcript ready:\n", transcriptText);
  sendTranscriptToBackend(transcriptText);
  transcriptChunks = [];
  interimResults = {};
}

/**
 * Extract meeting metadata from the page.
 * 
 * - For meeting name, it first tries to extract from an element with class "u6vdEc". 
 *   If not found, it falls back to common selectors and prompts the user if still empty.
 * - For participants, it extracts names from elements with class "zWGUib".
 */
function extractMeetingMetadata() {
  // Meeting Name: try class "u6vdEc" first
  let meetingNameElement = document.querySelector('.u6vdEc');
  if (!meetingNameElement) {
    meetingNameElement = document.querySelector('.meeting-title, [aria-label="Meeting title"], h1');
  }
  let meetingName = meetingNameElement ? meetingNameElement.innerText : "";
  if (!meetingName.trim()) {
    meetingName = prompt("Enter meeting name:", "Untitled Meeting") || "Untitled Meeting";
  }

  // Meeting Date/Time: current date/time
  const meetingDateTime = new Date().toISOString();

  // Participants: extract names from elements with class "zWGUib"
  const participantEls = document.querySelectorAll('.zWGUib');
  let participants = [];
  if (participantEls.length > 0) {
    participants = Array.from(participantEls)
      .map(el => el.innerText.trim())
      .filter(name => name && name !== "משתתפים"); // Exclude generic label if present
  }

  // Generate a unique meeting ID
  const meetingUniqueId = "meet-" + Date.now();

  // Dummy user identifier
  const user = window.user || "dummy_user_id";

  return {
    meetingName,
    meetingDateTime,
    participants,
    meetingUniqueId,
    user
  };
}

/**
 * Sends the transcript and meeting metadata to the backend.
 */
function sendTranscriptToBackend(transcriptText) {
  if (!transcriptText.trim()) {
    console.warn("⚠️ [content.js] Transcript is empty; skipping upload.");
    return;
  }
  
  const metadata = extractMeetingMetadata();
  const payload = {
    transcript: transcriptText,
    ...metadata
  };
  
  console.debug("📨 [content.js] Sending transcript to backend with payload:", payload);

  chrome.runtime.sendMessage({ action: "upload_transcript", payload }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ [content.js] Failed to send transcript:", chrome.runtime.lastError);
    } else {
      console.debug("✅ [content.js] Transcript message sent to backend successfully.");
    }
  });
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
    default:
      console.warn("⚠️ [content.js] Unrecognized message action:", message.action);
  }
});
