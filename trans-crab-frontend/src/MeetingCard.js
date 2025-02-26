import React, { useState } from 'react';
import './MeetingCard.css';

function MeetingCard({ meeting }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(prev => !prev);
  };

  return (
    <div className={`meeting-card ${expanded ? 'expanded' : ''}`} onClick={toggleExpand}>
      <div className="card-header">
        <h2>{meeting.meetingName}</h2>
        <p>{new Date(meeting.meetingDateTime).toLocaleString()}</p>
        <p>Participants: {meeting.participants.join(", ")}</p>
      </div>
      {expanded && (
        <div className="card-content">
          <p>{meeting.transcription}</p>
        </div>
      )}
    </div>
  );
}

export default MeetingCard;
