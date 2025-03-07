export class TranscriptionService {
    constructor(transcriptController) {
        this.recognition = null;
        this.isTranscribing = false;
        this.transcriptController = transcriptController;
    }

    /**
     * Starts the transcription process if not already active.
     * Initializes the speech recognition service and resets the transcript controller.
     */
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
        this.transcriptController.reset();
        console.debug("🎤 Starting transcription session...");

        try {
            this.initializeRecognition();
        } catch (err) {
            console.error("❌ Failed to initialize SpeechRecognition:", err);
        }
    }

    /**
     * Initializes the speech recognition object and sets up event handlers.
     * Starts the recognition process.
     */
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

    /**
     * Sets up event handlers for the speech recognition object.
     */
    setupRecognitionHandlers() {
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.handleRecognitionEnd();
    }

    /**
     * Handles the result event from the speech recognition.
     * Processes the recognition result using the transcript controller.
     */
    handleRecognitionResult(event) {
        console.debug(`%c🎯 Recognition event received with ${event.results} results`, 'color: #ff6b6b');
        this.transcriptController.processRecognitionResult(event);
    }

    /**
     * Forcefully stops the transcription service and cleans up resources.
     * Ensures all event listeners are removed and interim results are saved.
     */
    async forceStop() {
        console.debug("🛑 Force stopping transcription service...");
        
        this.isTranscribing = false; // Prevent auto-restart
        
        // First, finalize any interim results before stopping
        if (this.transcriptController) {
            // Ensure we finalize interim results BEFORE cleaning up recognition
            if (typeof this.transcriptController.finalizeInterimResults === 'function') {
                const hadInterim = this.transcriptController.finalizeInterimResults();
                console.debug(hadInterim ? 
                    "📝 Interim results finalized for final transcript" : 
                    "ℹ️ No interim results to finalize");
            } else {
                // Fallback to just saving interim results
                this.transcriptController.saveInterimResults(true);
                console.debug("📝 Interim results saved (without finalization)");
            }
        }
        
        // Now clean up the recognition object
        if (this.recognition) {
            try {
                // Remove all event listeners
                this.recognition.onresult = null;
                this.recognition.onerror = null;
                this.recognition.onend = null;
                
                // Force stop the recognition
                if (typeof this.recognition.abort === 'function') {
                    await this.recognition.abort();
                }
                this.recognition.stop();
            } catch (error) {
                console.warn("⚠️ Error during recognition stop:", error);
            } finally {
                // Ensure cleanup happens regardless of errors
                this.recognition = null;
                console.debug("✅ Recognition service cleaned up");
            }
        }
        
        console.debug("📝 Final results processed");
    }

    /**
     * Stops the transcription process if active.
     * Saves any remaining interim results and resolves when recognition is fully stopped.
     */
    async stop() {
        if (!this.isTranscribing) {
            console.debug("🚫 No active transcription to stop.");
            return;
        }
        
        console.debug("🛑 Stopping transcription session...");
        this.isTranscribing = false;  // Set this before stopping to prevent auto-restart
        
        // Save any remaining interim results
        this.transcriptController.saveInterimResults();

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

    /**
     * Handles the end event of the speech recognition.
     * Saves interim results and optionally restarts recognition if still transcribing.
     */
    handleRecognitionEnd() {
        console.warn("🔒 Speech recognition ended.");
        this.transcriptController.saveInterimResults();
        
        // Only restart if explicitly transcribing and recognition exists
        if (this.isTranscribing && this.recognition) {
            console.debug("🔄 Auto-restart triggered");
            this.restartRecognition();
        } else {
            console.debug("🛑 No auto-restart: transcribing=", this.isTranscribing);
        }
    }

    /**
     * Restarts the speech recognition service after it has ended.
     * Used to maintain continuous transcription.
     */
    restartRecognition() {
        console.debug("🔄 Restarting speech recognition...");
        
        if (this.recognition) {
            // Clean up existing recognition instance
            this.recognition.onresult = null;
            this.recognition.onerror = null;
            this.recognition.onend = null;
            this.recognition = null;
        }
        
        // Short delay before restarting to avoid potential issues
        setTimeout(() => {
            try {
                this.initializeRecognition();
            } catch (err) {
                console.error("❌ Failed to restart recognition:", err);
                this.isTranscribing = false;
            }
        }, 300);
    }
}