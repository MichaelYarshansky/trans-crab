import React, { useState, useEffect } from 'react';
import MeetingCard from './components/MeetingCard';
import MeetingPopup from './components/MeetingPopup';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/transcriptions')
      .then(response => response.json())
      .then(data => {
        console.log('Full API response:', data);
        // Log all available fields in the first meeting
        const firstMeeting = data.transcriptions?.[0];
        console.log('Available fields in meeting:', Object.keys(firstMeeting));
        
        const processedMeetings = data.transcriptions?.map(meeting => ({
          ...meeting,
          transcript: meeting.transcription || meeting.transcript || meeting.rawTranscript || meeting.text || 'No transcript available'
        }));
        setMeetings(processedMeetings || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching meetings:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const handleCardClick = (meeting) => {
    console.log('Selected meeting data:', meeting);
    setSelectedMeeting(meeting);
  };

  return (
    <div className="app-container">
      <Settings />
      <header className="app-header">
        <h1>Trans-Crab Dashboard 🦀</h1>
        <p className="subtitle">Your Meeting Transcriptions</p>
      </header>
      
      <div className="meetings-grid">
        {meetings.map((meeting) => (
          <MeetingCard 
            key={meeting._id || meeting.id} 
            meeting={meeting}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {selectedMeeting && (
        <MeetingPopup 
          meeting={selectedMeeting} 
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  );
}

export default App;
