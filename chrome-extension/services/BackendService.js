export class BackendService {
    static async sendTranscript(transcriptText) {
        console.debug("🚀 Starting transcript upload process...");
        
        if (!transcriptText.trim()) {
            console.warn("⚠️ Transcript is empty; skipping upload.");
            return;
        }

        const meetingData = this.extractMetadata();
        console.debug("📊 Extracted meeting data:", meetingData);

        const payload = {
            transcript: transcriptText,
            ...meetingData
        };

        console.debug("📦 Prepared payload for upload:", payload);

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "upload_transcript", payload },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("❌ Failed to send transcript:", chrome.runtime.lastError);
                        reject(chrome.runtime.lastError);
                    } else {
                        console.debug("✅ Transcript successfully sent to backend");
                        resolve(response);
                    }
                }
            );
        });
    }

    static extractMetadata() {
        // Meeting Name extraction (unchanged)
        let meetingNameElement = document.querySelector('.u6vdEc') ||
            document.querySelector('.meeting-title, [aria-label="Meeting title"], h1');
        
        let meetingName = meetingNameElement ? meetingNameElement.innerText : "";
        if (!meetingName.trim()) {
            meetingName = "Untitled Meeting";
        }

        // Enhanced participants extraction
        const participants = this.extractParticipants();
        console.debug(`👥 Found ${participants.length} participants:`, participants);

        return {
            meetingName,
            meetingDateTime: new Date().toISOString(),
            participants,
            meetingUniqueId: "meet-" + Date.now(),
            user: window.user || "dummy_user_id"
        };
    }

    static extractParticipants() {
        // Try multiple selectors for participant names
        const selectors = [
            '.zWGUib',                    // Primary Google Meet selector
            '[data-participant-id]',      // Alternative participant container
            '.KV1GEc',                    // Another Meet participant class
            '.YMlIz',                     // Participant panel entries
            '[role="listitem"]',          // Generic list items in participant panel
            '.rua5Nb'                     // Additional Meet participant class
        ];

        const participants = new Set();

        // Try each selector
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const name = el.innerText.trim();
                if (this.isValidParticipantName(name)) {
                    participants.add(name);
                }
            });
        });

        return Array.from(participants);
    }

    static isValidParticipantName(name) {
        // Filter out common non-name elements
        const invalidNames = [
            '',
            'משתתפים',
            'Participants',
            'You',
            'Present',
            'Presenting',
            'Host',
            'Co-host'
        ];

        return name && 
               !invalidNames.includes(name) && 
               name.length > 1 &&
               !name.includes('(') &&        // Exclude status indicators
               !name.startsWith('Meeting');  // Exclude meeting information
    }
}
