// content.js
// Handles speech transcription on Google Meet and Zoom by starting/stopping speech recognition,
// accumulating the transcript, and sending it to the background script for download.
// Automatic meeting-end detection has been removed for reliability.

console.debug("🔵 [content.js] Loaded and ready.");

let recognition = null;
let isTranscribing = false;
let transcript = "";

// Listen for messages from the popup (start/stop transcription, ping check, file download trigger)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.debug("📬 [content.js] Received message:", message);
  switch (message.action) {
    case "start_transcription":
      console.debug("🎤 [content.js] Starting transcription.");
      startTranscription();
      sendResponse({ status: "Started" });
      break;
    case "stop_transcription":
      console.debug("🛑 [content.js] Stopping transcription.");
      stopTranscription();
      sendResponse({ status: "Stopped" });
      break;
    case "ping":
      // Respond to ping to indicate that the content script is injected
      sendResponse({ status: "available" });
      break;
    case "download_transcript_content":
      // Trigger file download in the current tab
      createTranscriptFile(message.transcript);
      break;
    default:
      console.warn("⚠️ [content.js] Unknown action:", message.action);
  }
});

/**
 * Initialize and start speech recognition.
 */
function startTranscription() {
  if (isTranscribing) return;
  
  // Check for SpeechRecognition support
  if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
    console.error("🚫 [content.js] Speech recognition is not supported in this browser.");
    return;
  }
  
  isTranscribing = true;
  transcript = ""; // Reset transcript
  
  // Create and configure the SpeechRecognition instance
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "he-IL"; // Default to Hebrew
  
  recognition.onresult = (event) => {
    let newTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        newTranscript += event.results[i][0].transcript + " ";
      }
    }
    transcript += newTranscript;
    console.debug("📝 [content.js] New transcript chunk:", newTranscript);
  };

  recognition.onerror = (event) => {
    console.error("❌ [content.js] Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    console.warn("⚠️ [content.js] Speech recognition ended.");
    // If we're still transcribing, restart automatically
    if (isTranscribing) {
      console.debug("🔄 [content.js] Restarting speech recognition.");
      recognition.start();
    }
  };

  recognition.start();
  console.debug("🚀 [content.js] Speech recognition started.");
}

/**
 * Stop transcription and, after a short delay, send the final transcript.
 */
function stopTranscription() {
  if (!isTranscribing) return;
  isTranscribing = false;
  console.debug("🛑 [content.js] Stopping speech recognition.");
  recognition.stop();
  
  // Delay to capture any final words before sending transcript
  setTimeout(() => {
    console.debug("📤 [content.js] Sending final transcript:", transcript);
    sendTranscriptToBackground();
  }, 3000);
}

/**
 * Send transcript to background for file download and reset the transcript.
 */
function sendTranscriptToBackground() {
  if (!transcript.trim()) {
    console.warn("⚠️ [content.js] No transcript available. Skipping file download.");
    return;
  }
  chrome.runtime.sendMessage({ action: "download_transcript", transcript }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("❌ [content.js] Failed to send transcript:", chrome.runtime.lastError);
    } else {
      console.debug("✅ [content.js] Transcript sent successfully to background.");
    }
  });
  transcript = ""; // Reset transcript
}

/**
 * Create and auto-download the transcript file in the current tab.
 * Triggered by the "download_transcript_content" action from background.js.
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
  console.debug("✅ [content.js] Transcript file downloaded.");
}
