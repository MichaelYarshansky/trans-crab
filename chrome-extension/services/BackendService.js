export class BackendService {
    static async sendTranscript(transcriptText) {
        console.debug("🚀 Starting transcript upload process...");
        
        if (!transcriptText.trim()) {
            console.warn("⚠️ Transcript is empty; skipping upload.");
            return;
        }

        const metadata = this.extractMetadata();
        console.debug("📊 Extracted metadata:", metadata);

        const payload = {
            transcript: transcriptText,
            ...metadata
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
        // Meeting Name
        let meetingNameElement = document.querySelector('.u6vdEc') ||
            document.querySelector('.meeting-title, [aria-label="Meeting title"], h1');
        
        let meetingName = meetingNameElement ? meetingNameElement.innerText : "";
        if (!meetingName.trim()) {
            meetingName = "Untitled Meeting";
        }

        // Meeting Date/Time
        const meetingDateTime = new Date().toISOString();

        // Participants
        const participantEls = document.querySelectorAll('.zWGUib');
        const participants = Array.from(participantEls)
            .map(el => el.innerText.trim())
            .filter(name => name && name !== "משתתפים");

        return {
            meetingName,
            meetingDateTime,
            participants,
            meetingUniqueId: "meet-" + Date.now(),
            user: window.user || "dummy_user_id"
        };
    }
}
