/**
 * Content Script for Trans-Crab.
 *
 * This script manages speech transcription for supported meeting sites
 * (Google Meet and Zoom). It listens for commands from the extension popup
 * to start or stop transcription and triggers the transcript download via messaging
 * with the background script.
 *
 * Automatic meeting-end detection is not implemented in this version.
 */

"use strict";

console.debug("🔵 [content.js] Trans-Crab content script loaded and ready.");

let recognition = null;
let isTranscribing = false;
// Instead of a single string, we store transcript chunks in an array.
let transcriptChunks = [];
const STOP_DELAY_MS = 5000; // Increased delay (in ms) before sending the final transcript after stop

/**
 * Initializes and starts the SpeechRecognition API.
 */
function startTranscription() {
  if (isTranscribing) {
    console.debug("🚫 [content.js] Transcription already in progress; ignoring start command.");
    return;
  }
  
  // Verify SpeechRecognition API support
  if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
    console.error("🚫 [content.js] Speech recognition is not supported in this browser.");
    return;
  }
  
  isTranscribing = true;
  transcriptChunks = []; // Reset transcript chunks
  
  try {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  } catch (err) {
    console.error("❌ [content.js] Failed to initialize SpeechRecognition:", err);
    return;
  }
  
  // Configure the SpeechRecognition instance
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "he-IL"; // Default to Hebrew
  
  recognition.onresult = (event) => {
    let finalChunk = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalChunk += event.results[i][0].transcript + " ";
      }
    }
    if (finalChunk.trim()) {
      // Prepend a timestamp for the chunk
      let timestamp = new Date().toLocaleTimeString();
      transcriptChunks.push(`[${timestamp}] ${finalChunk.trim()}`);
      console.debug("📝 [content.js] New transcript chunk:", finalChunk.trim());
    }
  };

  recognition.onerror = (event) => {
    console.error("❌ [content.js] Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.warn("⚠️ [content.js] Speech recognition ended.");
    // Restart automatically if still transcribing
    if (isTranscribing) {
      console.debug("🔄 [content.js] Restarting speech recognition.");
      try {
        recognition.start();
      } catch (err) {
        console.error("❌ [content.js] Error restarting SpeechRecognition:", err);
      }
    }
  };

  try {
    recognition.start();
    console.debug("🚀 [content.js] Speech recognition started.");
  } catch (err) {
    console.error("❌ [content.js] Failed to start SpeechRecognition:", err);
  }
}

/**
 * Stops the transcription process and, after a short delay,
 * sends the final transcript (with chunk separation) to the background script.
 */
function stopTranscription() {
  if (!isTranscribing) {
    console.debug("🚫 [content.js] No active transcription to stop.");
    return;
  }
  isTranscribing = false;
  console.debug("🛑 [content.js] Stopping speech recognition.");
  try {
    recognition.stop();
  } catch (err) {
    console.error("❌ [content.js] Error stopping SpeechRecognition:", err);
  }
  // Delay increased to capture any final words before sending transcript
  setTimeout(() => {
    let transcriptText = transcriptChunks.join("\n\n");
    console.debug("📤 [content.js] Sending final transcript:\n", transcriptText);
    sendTranscriptToBackground(transcriptText);
  }, STOP_DELAY_MS);
}

/**
 * Sends the transcript to the background script for file download.
 * @param {string} transcriptText - The complete transcript text with chunks.
 */
function sendTranscriptToBackground(transcriptText) {
  if (!transcriptText.trim()) {
    console.warn("⚠️ [content.js] Transcript is empty; no file will be downloaded.");
    return;
  }
  chrome.runtime.sendMessage({ action: "download_transcript", transcript: transcriptText }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ [content.js] Failed to send transcript:", chrome.runtime.lastError);
    } else {
      console.debug("✅ [content.js] Transcript sent to background successfully.");
    }
  });
  transcriptChunks = []; // Reset transcript chunks
}

/**
 * Creates and triggers the download of the transcript file.
 * @param {string} text - The transcript text.
 */
function createTranscriptFile(text) {
  console.debug("📂 [content.js] Creating transcript file for download.");
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
 * Listens for messages from the popup and delegates actions.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.debug("📬 [content.js] Received message:", message);
  switch (message.action) {
    case "start_transcription":
      console.debug("🎤 [content.js] Start command received.");
      startTranscription();
      sendResponse({ status: "Started" });
      break;
    case "stop_transcription":
      console.debug("🛑 [content.js] Stop command received.");
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
