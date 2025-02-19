console.log("✅ popup.js is executing!");

let timerInterval;
let seconds = 0;

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ popup.js: DOM fully loaded!");

    const transcribeBtn = document.getElementById("transcribe-btn");
    const statusText = document.getElementById("status");

    if (!transcribeBtn || !statusText) {
        console.error("🚨 Button or status text not found in popup!");
        return;
    }

    console.log("✅ popup.js: Button found, adding event listener.");

    // Load saved state
    chrome.storage.local.get(["isTranscribing", "elapsedSeconds"], (data) => {
        if (data.isTranscribing) {
            startTimer(data.elapsedSeconds || 0);
            updateUI(true);
        }
    });

    transcribeBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("🚨 No active tab found!");
                return;
            }
            
            const isCurrentlyTranscribing = transcribeBtn.classList.contains("transcribing");
            const action = isCurrentlyTranscribing ? "stop_transcription" : "start_transcription";

            console.log(`📩 Sending message to content.js: { action: "${action}" }`);

            chrome.tabs.sendMessage(tabs[0].id, { action }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("🚨 Failed to send message:", chrome.runtime.lastError);
                } else if (response && response.status === "Started") {
                    console.log("✅ Transcription started, updating UI.");
                    startTimer(0);
                    updateUI(true);
                } else if (response && response.status === "Stopped") {
                    console.log("✅ Transcription stopped, updating UI.");
                    stopTimer();
                    updateUI(false);
                }
            });
        });
    });
});

function startTimer(startingSeconds) {
    console.log("⏳ Starting timer from", startingSeconds, "seconds");
    seconds = startingSeconds;
    chrome.storage.local.set({ elapsedSeconds: seconds });
    updateTimerText();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds++;
        updateTimerText();
        chrome.storage.local.set({ elapsedSeconds: seconds });
    }, 1000);
}

function stopTimer() {
    console.log("⏹️ Stopping timer.");
    clearInterval(timerInterval);
    seconds = 0;
    chrome.storage.local.set({ elapsedSeconds: 0 });
    document.getElementById("status").innerText = "Not transcribing";
}

function updateTimerText() {
    let min = String(Math.floor(seconds / 60)).padStart(2, "0");
    let sec = String(seconds % 60).padStart(2, "0");
    document.getElementById("status").innerText = `Transcribing... ${min}:${sec}`;
}

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
