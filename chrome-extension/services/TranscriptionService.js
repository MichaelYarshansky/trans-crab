export class TranscriptionService {
    constructor(transcriptManager) {
        this.recognition = null;
        this.isTranscribing = false;
        this.transcriptManager = transcriptManager;
    }

    start() {
        if (this.isTranscribing) {
            console.debug("🚫 Already transcribing; ignoring start request.");
            return;
        }

        if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
            console.error("🚫 Speech recognition is not supported in this browser.");
            return;
        }

        this.isTranscribing = true;
        this.transcriptManager.reset();
        console.debug("🎤 Starting transcription session...");

        try {
            this.initializeRecognition();
        } catch (err) {
            console.error("❌ Failed to initialize SpeechRecognition:", err);
        }
    }

    initializeRecognition() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "he-IL";

        this.setupRecognitionHandlers();
        
        try {
            this.recognition.start();
            console.debug("🎤 Speech recognition initialized and started");
        } catch (err) {
            console.error("❌ Failed to start recognition:", err);
            throw err;
        }
    }

    setupRecognitionHandlers() {
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.handleRecognitionEnd();
    }

    handleRecognitionResult(event) {
        // console.debug(`🎯 Recognition event received with ${event.results} results`);
        this.transcriptManager.processRecognitionResult(event);
    }

    async stop() {
        if (!this.isTranscribing) {
            console.debug("🚫 No active transcription to stop.");
            return;
        }
        
        console.debug("🛑 Stopping transcription session...");
        this.isTranscribing = false;  // Set this before stopping to prevent auto-restart
        
        // Save any remaining interim results
        this.transcriptManager.saveInterimResults();

        return new Promise((resolve, reject) => {
            try {
                if (this.recognition) {
                    // Listen for the end event before resolving
                    this.recognition.onend = () => {
                        console.debug("✅ Recognition fully stopped");
                        this.recognition = null;
                        resolve();
                    };
                    this.recognition.stop();
                } else {
                    resolve();
                }
            } catch (err) {
                console.error("❌ Error stopping SpeechRecognition:", err);
                this.recognition = null;
                reject(err);
            }
        });
    }

    async forceStop() {
        console.debug("🛑 Force stopping transcription service...");
        
        this.isTranscribing = false; // Prevent auto-restart
        
        if (this.recognition) {
            try {
                // Remove all event listeners
                this.recognition.onresult = null;
                this.recognition.onerror = null;
                this.recognition.onend = null;
                
                // Force stop the recognition
                await this.recognition.abort();
                this.recognition.stop();
            } catch (error) {
                console.warn("⚠️ Error during recognition stop:", error);
            } finally {
                // Ensure cleanup happens regardless of errors
                this.recognition = null;
                console.debug("✅ Recognition service cleaned up");
            }
        }
        
        // Save any remaining interim results
        this.transcriptManager.saveInterimResults();
        console.debug("📝 Final results saved");
    }

    handleRecognitionEnd() {
        console.warn("🔒 Speech recognition ended.");
        this.transcriptManager.saveInterimResults();
        
        // Only restart if explicitly transcribing and recognition exists
        if (this.isTranscribing && this.recognition) {
            console.debug("🔄 Auto-restart triggered");
            this.restartRecognition();
        } else {
            console.debug("🛑 No auto-restart: transcribing=", this.isTranscribing);
        }
    }
}