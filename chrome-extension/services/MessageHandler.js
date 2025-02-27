import { BackendService } from './BackendService.js';

export class MessageHandler {
    constructor(transcriptionService) {
        this.transcriptionService = transcriptionService;
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.debug("📬 Received message:", message);
            
            switch (message.action) {
                case "start_transcription":
                    this.transcriptionService.start();
                    sendResponse({ status: "Started" });
                    break;
                    
                case "stop_transcription":
                    this.handleStopTranscription(sendResponse);
                    break;
                    
                case "ping":
                    sendResponse({ status: "available" });
                    break;
                    
                default:
                    console.warn("⚠️ Unrecognized message action:", message.action);
            }
        });
    }

    async handleStopTranscription(sendResponse) {
        console.debug("🛑 Handling stop transcription request...");
        
        // Stop the transcription
        this.transcriptionService.stop();

        // Get the final transcript
        const transcript = this.transcriptionService.transcriptManager.getTranscript();
        console.debug("📝 Final transcript ready for upload");

        try {
            // Send to backend
            await BackendService.sendTranscript(transcript);
            console.debug("✅ Transcript successfully uploaded to server");
            sendResponse({ status: "Stopped and uploaded" });
        } catch (error) {
            console.error("❌ Failed to upload transcript:", error);
            sendResponse({ status: "Stopped but upload failed", error: error.message });
        }
    }
}

