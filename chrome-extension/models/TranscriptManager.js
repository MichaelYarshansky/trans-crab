export class TranscriptManager {
    constructor() {
        this.transcriptChunks = [];
        this.interimResults = {};
        this.lastInterimSaveTime = 0;
        this.INTERIM_SAVE_INTERVAL = 3000;
    }

    reset() {
        this.transcriptChunks = [];
        this.interimResults = {};
        this.lastInterimSaveTime = Date.now();
    }

    processRecognitionResult(event) {
        const now = Date.now();
        let hasNewInterim = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript.trim();

            if (result.isFinal) {
                this.addFinalResult(text);
                delete this.interimResults[i];
            } else {
                this.interimResults[i] = text;
                hasNewInterim = true;
            }
        }

        if (hasNewInterim && (now - this.lastInterimSaveTime) > this.INTERIM_SAVE_INTERVAL) {
            this.saveInterimResults();
            this.lastInterimSaveTime = now;
        }
    }

    addFinalResult(text) {
        const timestamp = new Date().toLocaleTimeString();
        this.transcriptChunks.push(`[${timestamp}] ${text}`);
        console.debug(`✨ New transcribed text: "${text}"`);
    }

    saveInterimResults() {
        if (Object.keys(this.interimResults).length === 0) return;
        
        const combinedInterim = Object.values(this.interimResults).join(" ");
        
        if (combinedInterim.trim()) {
            const timestamp = new Date().toLocaleTimeString();
            this.transcriptChunks.push(`[${timestamp}] ${combinedInterim} [interim]`);
            console.debug(`📝 New interim text: "${combinedInterim}"`);
        }
    }

    getTranscript() {
        this.saveInterimResults();
        return this.transcriptChunks.join("\n\n");
    }
}
