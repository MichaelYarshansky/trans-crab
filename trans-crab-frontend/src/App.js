import React, { useState, useEffect } from 'react';
import MeetingCard from './MeetingCard';

function App() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch real meetings from the backend API
    fetch('http://localhost:5001/api/transcriptions')
      .then(response => response.json())
      .then(data => {
        // The API returns an object with a "transcriptions" field
        setMeetings(data.transcriptions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching meetings:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading meetings...</div>;
  if (error) return <div>Error loading meetings: {error.message}</div>;

  return (
    <div className="app-container">
      <h1>Trans-Crab Dashboard</h1>
      <div className="meetings-list">
        {meetings.map((meeting) => (
          <MeetingCard key={meeting._id || meeting.id} meeting={meeting} />
        ))}
      </div>
    </div>
  );
}

export default App;
