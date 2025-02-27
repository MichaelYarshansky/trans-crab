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
                    this.forceStopTranscription(sendResponse);
                    return true; // Keep the message channel open for async response
                    
                case "ping":
                    sendResponse({ status: "available" });
                    break;
                    
                default:
                    console.warn("⚠️ Unrecognized message action:", message.action);
            }
        });
    }

    async forceStopTranscription(sendResponse) {
        try {
            console.debug("🛑 Force stopping transcription...");
            await this.transcriptionService.forceStop();
            
            const transcript = this.transcriptionService.transcriptManager.getTranscript();
            await BackendService.sendTranscript(transcript);
            
            console.debug("✅ Transcription stopped and uploaded successfully");
            sendResponse({ status: "Stopped", success: true });
        } catch (error) {
            console.error("❌ Error during stop process:", error);
            sendResponse({ status: "Error", success: false, error: error.message });
        }
    }
}

