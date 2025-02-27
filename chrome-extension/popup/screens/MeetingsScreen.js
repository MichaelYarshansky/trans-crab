import { MeetingCard } from '../components/MeetingCard.js';
import { MeetingDetailsPopup } from '../components/MeetingDetailsPopup.js';

export class MeetingsScreen {
    constructor() {
        this.container = document.querySelector('#meetings-container');
        this.loadMeetings();
    }

    async loadMeetings() {
        try {
            const meetings = await this.fetchMeetings();
            this.renderMeetings(meetings);
        } catch (error) {
            console.error('Failed to load meetings:', error);
            this.showError('Failed to load meetings');
        }
    }

    renderMeetings(meetings) {
        this.container.innerHTML = '';
        
        if (!meetings.length) {
            this.container.innerHTML = `
                <div class="no-meetings">
                    <p>No recorded meetings yet</p>
                </div>
            `;
            return;
        }

        meetings.forEach(meeting => {
            const card = new MeetingCard(meeting);
            this.container.appendChild(card.element);
        });
    }

    async fetchMeetings() {
        // Fetch meetings from storage or API
        return new Promise((resolve) => {
            chrome.storage.local.get(['meetings'], (result) => {
                resolve(result.meetings || []);
            });
        });
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }
}