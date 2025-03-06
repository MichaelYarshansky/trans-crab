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
            
            // Capture the last words by finalizing any pending speech
            if (transcriptManager && typeof transcriptManager.finalizeInterimResults === 'function') {
                const hadInterim = transcriptManager.finalizeInterimResults();
                console.debug(hadInterim ? 
                    "✅ Successfully finalized last speech batch" : 
                    "ℹ️ No interim results to finalize");
            }
            
            // Stop the service
            await this.transcriptionService.forceStop();
            
            // Try to get the transcript using the stored reference
            let transcript = "No transcript available";
            if (transcriptManager) {
                if (typeof transcriptManager.getFinalizedTranscript === 'function') {
                    // Use getFinalizedTranscript instead of getTranscript to avoid duplications
                    transcript = transcriptManager.getFinalizedTranscript();
                    console.debug("📝 Retrieved finalized transcript successfully");
                } else if (typeof transcriptManager.getTranscript === 'function') {
                    // Fallback to getTranscript if getFinalizedTranscript is not available
                    transcript = transcriptManager.getTranscript();
                    console.debug("📝 Retrieved transcript successfully (using fallback method)");
                } else {
                    console.warn("⚠️ Transcript retrieval methods not available");
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
    
    /**
     * Finalizes any pending speech to ensure the last words are captured
     * This helps catch words that might be in progress when the meeting ends
     * @param {Object} transcriptManager - The transcript controller/manager
     */
    finalizeLastSpeech(transcriptManager) {
        if (!transcriptManager) return;
        
        try {
            console.debug("🔍 Finalizing last speech batch...");
            
            // First save any interim results
            if (typeof transcriptManager.saveInterimResults === 'function') {
                transcriptManager.saveInterimResults(true);
            }
            
            // If there's a method to convert interim to final, use it
            if (typeof transcriptManager.finalizeInterimResults === 'function') {
                transcriptManager.finalizeInterimResults();
                console.debug("✅ Successfully finalized last speech batch");
            } else {
                // If no specific method exists, we've at least saved the interim results
                console.debug("ℹ️ No specific finalization method available, used saveInterimResults instead");
            }
        } catch (error) {
            console.warn("⚠️ Error finalizing last speech:", error);
        }
    }
}

