export class MetadataService {
    static extractMetadata() {
        return {
            meetingName: this.getMeetingName(),
            meetingDateTime: new Date().toISOString(),
            participants: this.getParticipants(),
            meetingUniqueId: "meet-" + Date.now(),
            user: window.user || "dummy_user_id"
        };
    }

    static getMeetingName() {
        let meetingNameElement = document.querySelector('.u6vdEc') ||
            document.querySelector('.meeting-title, [aria-label="Meeting title"], h1');
        
        let meetingName = meetingNameElement ? meetingNameElement.innerText : "";
        if (!meetingName.trim()) {
            meetingName = prompt("Enter meeting name:", "Untitled Meeting") || "Untitled Meeting";
        }
        return meetingName;
    }

    static getParticipants() {
        const participantEls = document.querySelectorAll('.zWGUib');
        if (participantEls.length === 0) return ["no participants found"];

        return Array.from(participantEls)
            .map(el => el.innerText.trim())
            .filter(name => name && name !== "משתתפים");
    }
}