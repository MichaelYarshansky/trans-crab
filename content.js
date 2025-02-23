console.log("✅ content.js loaded into Google Meet!");

let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let retryCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Received message in content.js:", message);

    if (message.action === "start_transcription") {
        console.log("🎙️ Starting audio recording...");
        startRecording();
        sendResponse({ status: "Started" });
    } else if (message.action === "stop_transcription") {
        console.log("⏹️ Stopping audio recording...");
        stopRecording();
        sendResponse({ status: "Stopped" });
    }
});

function startRecording() {
    if (isRecording) return;
    isRecording = true;
    audioChunks = [];

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                console.log("✅ Audio recording stopped. Sending to Whisper API...");
                retryCount = 0;
                sendAudioToWhisper();
            };
            mediaRecorder.start();
        })
        .catch(error => {
            console.error("🚨 Error accessing microphone:", error);
        });
}

function stopRecording() {
    if (!isRecording) return;
    isRecording = false;
    mediaRecorder.stop();
}

function sendAudioToWhisper() {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

    // Prevent sending very short recordings to avoid hitting rate limits
    if (audioBlob.size < 5000) { // ~5KB minimum
        console.warn("⚠️ Audio clip too short, skipping API request.");
        return;
    }

    chrome.storage.local.get(["openai_api_key"], (result) => {
        if (!result.openai_api_key) {
            console.error("🚨 No API Key found! Set it in chrome.storage.");
            return;
        }

        console.log("🔑 Using stored API Key. Sending request to Whisper API...");

        const formData = new FormData();
        formData.append("file", audioBlob, "audio/webm");
        formData.append("model", "whisper-1");

        fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${result.openai_api_key}`
            },
            body: formData
        })
        .then(response => {
            if (response.status === 429) {
                console.error(`🚨 Whisper API Rate Limit Exceeded! Retrying in ${3 ** retryCount} seconds...`);
                
                if (retryCount < 3) {
                    setTimeout(sendAudioToWhisper, 3000 * (3 ** retryCount));
                    retryCount++;
                } else {
                    console.error("❌ Maximum retries reached. Try again later.");
                }
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.text) {
                console.log("✅ Transcription complete! Sending transcript for download.");
                chrome.runtime.sendMessage({ action: "download_transcript", transcript: data.text });
            } else {
                console.warn("⚠️ No transcription returned from Whisper API.");
            }
        })
        .catch(error => {
            console.error("🚨 Whisper API error:", error);
        });
    });
}
