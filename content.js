console.log("✅ content.js loaded into Google Meet!");

let recognition;
let isTranscribing = false;
let transcript = ""; // 🛠 Keep transcript saved

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Received message in content.js:", message);

    if (message.action === "start_transcription") {
        console.log("🎙️ Starting transcription...");
        startTranscription();
        sendResponse({ status: "Started" });
    } else if (message.action === "stop_transcription") {
        console.log("⏹️ Stopping transcription...");
        stopTranscription();
        sendResponse({ status: "Stopped" });
    }
});

function startTranscription() {
    if (isTranscribing) return;
    isTranscribing = true;
    console.log("🎙️ Transcription started.");

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "he-IL";

    recognition.onresult = (event) => {
        let newTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                newTranscript += event.results[i][0].transcript + " ";
            }
        }
        transcript += newTranscript;
        console.log("📝 New transcript chunk:", newTranscript);
    };

    recognition.onerror = (event) => {
        console.error("🚨 Speech recognition error:", event.error);
    };

    recognition.onend = () => {
        console.warn("⚠️ Speech recognition ended. Restarting...");
        if (isTranscribing) recognition.start();
    };

    recognition.start();
}

// function stopTranscription() {
//     if (!isTranscribing) return;
//     isTranscribing = false;
//     recognition.stop();
//     sendTranscriptToBackground();
// }
function stopTranscription() {
    if (!isTranscribing) return;
    isTranscribing = false;

    console.log("⏹️ Stopping transcription...");

    // Stop recognition but wait for final results
    recognition.stop();

    // Allow some extra time for final processing
    setTimeout(() => {
        console.log("📩 Sending final transcript to background.js:", transcript);
        sendTranscriptToBackground();
    }, 3000); // ✅ Small delay ensures last words are captured before saving
}


function sendTranscriptToBackground() {
    if (!transcript.trim()) { // ✅ Fix: Ensure transcript is not empty
        console.warn("⚠️ No transcript available. Skipping file download.");
        return;
    }

    console.log("📩 Sending Hebrew transcript to background.js:", transcript);

    chrome.runtime.sendMessage({ action: "download_transcript", transcript }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("🚨 Failed to send transcript:", chrome.runtime.lastError);
        } else {
            console.log("✅ Transcript sent successfully!");
        }
    });

    transcript = ""; // ✅ Reset transcript after sending
}

// This section will be added at the end of content.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "download_transcript_content") {
        console.log("📂 Creating transcript file for download...");

        const blob = new Blob([message.transcript], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `meet_transcript_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log("✅ File downloaded successfully.");
    }
});
