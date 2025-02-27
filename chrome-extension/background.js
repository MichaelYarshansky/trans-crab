// background.js

console.debug("🔵 [background.js] Loaded.");

// Dynamically inject ContentScript.js as a module
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes("meet.google.com") || tab.url.includes("zoom.us")) {
      console.debug("🦀 Injecting ContentScript.js into:", tab.url);

      chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          import(chrome.runtime.getURL("content/ContentScript.js"))
            .then(() => {
              console.debug("✅ Module ContentScript.js loaded successfully.");
            })
            .catch(err => {
              console.error("❌ Failed to load ContentScript.js module:", err);
            });
        }
      });
    }
  }
});

// Listen for "upload_transcript" messages, POST to backend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "upload_transcript" && message.payload) {
    const { payload } = message;
    console.debug("📩 [background.js] Received payload:", payload);

    // Example: local dev server
    const SERVER_URL = "http://localhost:5001/api/transcriptions";

    fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transcript: payload.transcript,
        meetingName: payload.meetingName,
        meetingDateTime: payload.meetingDateTime,
        participants: payload.participants,
        meetingUniqueId: payload.meetingUniqueId,
        user: payload.user
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.debug("✅ [background.js] Server response:", data);
        sendResponse({ status: "Uploaded", data });
      })
      .catch(err => {
        console.error("❌ [background.js] Failed to upload transcript:", err);
        sendResponse({ status: "Error", error: err.message });
      });

    return true; // Async
  }
});
