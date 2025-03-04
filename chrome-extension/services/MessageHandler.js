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
            
            // Store a reference to the transcript manager before stopping
            const transcriptManager = this.transcriptionService.transcriptController || 
                                     this.transcriptionService.transcriptManager;
            
            // Stop the service
            await this.transcriptionService.forceStop();
            
            // Try to get the transcript using the stored reference
            let transcript = "No transcript available";
            if (transcriptManager) {
                if (typeof transcriptManager.getTranscript === 'function') {
                    transcript = transcriptManager.getTranscript();
                    console.debug("📝 Retrieved transcript successfully");
                } else {
                    console.warn("⚠️ getTranscript method not available");
                }
                
                // Try to send the transcript to the backend
                try {
                    await BackendService.sendTranscript(transcript);
                    console.debug("🚀 Transcript uploaded successfully");
                } catch (uploadError) {
                    console.error("❌ Error uploading transcript:", uploadError);
                }
            }
            
            console.debug("✅ Transcription stopped successfully");
            sendResponse({ status: "Stopped", success: true });
        } catch (error) {
            console.error("❌ Error during stop process:", error);
            sendResponse({ status: "Error", success: false, error: error.message });
        }
    }
}

