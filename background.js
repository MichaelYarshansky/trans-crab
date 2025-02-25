// background.js
// Listens for transcript messages from content.js and instructs the active tab to download the transcript file.

console.debug("🔵 [background.js] Loaded.");

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "download_transcript" && message.transcript) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "download_transcript_content", transcript: message.transcript });
    });
  }
});
