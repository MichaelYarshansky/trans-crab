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

    stop() {
        if (!this.isTranscribing) {
            console.debug("🚫 No active transcription to stop.");
            return;
        }
        this.isTranscribing = false;
        console.debug("🛑 Stopping transcription session...");
        this.transcriptManager.saveInterimResults();

        try {
            this.recognition.stop();
        } catch (err) {
            console.error("❌ Error stopping SpeechRecognition:", err);
        }
    }

    initializeRecognition() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "he-IL";

        this.setupRecognitionHandlers();
        this.recognition.start();
    }

    setupRecognitionHandlers() {
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.handleRecognitionEnd();
    }

    handleRecognitionResult(event) {
        this.transcriptManager.processRecognitionResult(event);
    }

    handleRecognitionError(event) {
        console.error("❌ Speech recognition error:", event.error);
        this.transcriptManager.saveInterimResults();
    }

    handleRecognitionEnd() {
        console.warn("🔒 Speech recognition ended.");
        this.transcriptManager.saveInterimResults();
        if (this.isTranscribing) {
            this.restartRecognition();
        }
    }

    restartRecognition() {
        console.debug("🔄 Restarting after onend...");
        try {
            this.recognition.start();
        } catch (err) {
            console.error("❌ Error restarting SpeechRecognition:", err);
        }
    }
}