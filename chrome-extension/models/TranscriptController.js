export class TranscriptController {
    constructor() {
        this.transcriptChunks = [];
        this.interimResults = {};
        this.finalResultIndices = new Set();
        this.lastInterimSaveTime = 0;
        this.INTERIM_SAVE_INTERVAL = 3000;
    }

    /**
     * Resets the transcript data, clearing all stored chunks and interim results.
     */
    reset() {
        this.transcriptChunks = [];
        this.interimResults = {};
        this.finalResultIndices = new Set();
        this.lastInterimSaveTime = Date.now();
    }

    /**
     * Processes the recognition result event.
     * Adds final results to the transcript and manages interim results.
     * Prevents duplicates by tracking which results have been finalized.
     * @param {SpeechRecognitionEvent} event - The recognition event containing results.
     */
    processRecognitionResult(event) {
        const now = Date.now();
        let hasNewInterim = false;
        
        // Process all results from the event
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript.trim();
            
            if (!text) continue; // Skip empty results
            
            if (result.isFinal) {
                // Only process final results we haven't seen before
                if (!this.finalResultIndices.has(i)) {
                    this.addFinalResult(text);
                    this.finalResultIndices.add(i);
                    
                    // Remove any interim results that might contain this text
                    Object.keys(this.interimResults).forEach(key => {
                        if (key.startsWith(`${i}-`)) {
                            delete this.interimResults[key];
                        }
                    });
                }
            } else {
                // For interim results, use a key that includes the result index
                // but NOT the timestamp to avoid duplicates
                const key = `${i}-interim`;
                
                // Only update if the text has changed
                if (this.interimResults[key] !== text) {
                    this.interimResults[key] = text;
                    hasNewInterim = true;
                }
            }
        }

        // Save interim results periodically, but not too frequently
        if (hasNewInterim && (now - this.lastInterimSaveTime) > this.INTERIM_SAVE_INTERVAL) {
            this.saveInterimResults(false); // Don't clear interim results yet
            this.lastInterimSaveTime = now;
        }
    }

    /**
     * Adds a final transcribed text to the transcript chunks with a timestamp.
     * @param {string} text - The final transcribed text.
     */
    addFinalResult(text) {
        const timestamp = new Date().toLocaleTimeString();
        this.transcriptChunks.push(`[${timestamp}] ${text}`);
        console.debug(`✨ New transcribed text: "${text}"`);
    }

    /**
     * Saves interim results by combining them into a single string with a timestamp.
     * @param {boolean} clearAfterSaving - Whether to clear interim results after saving
     */
    saveInterimResults(clearAfterSaving = true) {
        if (Object.keys(this.interimResults).length === 0) return;
        
        // Group interim results by their base index to avoid duplicates
        const groupedResults = {};
        
        Object.entries(this.interimResults).forEach(([key, value]) => {
            const baseIndex = key.split('-')[0];
            // Only keep the latest interim result for each base index
            groupedResults[baseIndex] = value;
        });
        
        const combinedInterim = Object.values(groupedResults).join(" ");
        
        if (combinedInterim.trim()) {
            const timestamp = new Date().toLocaleTimeString();
            // Mark as interim to distinguish from final results
            this.transcriptChunks.push(`[${timestamp}] ${combinedInterim} [interim]`);
            console.debug(`📝 New interim text: "${combinedInterim}"`);
        }
        
        // Optionally clear interim results after saving
        if (clearAfterSaving) {
            this.interimResults = {};
        }
    }

    /**
     * Retrieves the full transcript, including any unsaved interim results.
     * @returns {string} The complete transcript as a string.
     */
    getTranscript() {
        this.saveInterimResults(true);
        return this.transcriptChunks.join("\n\n");
    }
}
