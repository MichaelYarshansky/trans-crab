// background.js

console.debug("🔵 [background.js] Loaded.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Listen for "upload_transcript" action from content.js
  if (message.action === "upload_transcript" && message.payload) {
    const { payload } = message;
    console.debug("📩 [background.js] Received payload from content.js:", payload);

    // Make a POST request to your backend
    fetch("http://localhost:5001/api/transcriptions", {
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
    .then(response => response.json())
    .then(data => {
      console.debug("✅ [background.js] Server response:", data);
      sendResponse({ status: "Uploaded", data });
    })
    .catch(err => {
      console.error("❌ [background.js] Failed to upload transcript:", err);
      sendResponse({ status: "Error", error: err });
    });

    // Return true to indicate async response
    return true;
  }
});

