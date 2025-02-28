import React from 'react';
import './MeetingCard.css';

function MeetingCard({ meeting, onCardClick }) {
  const { meetingName, meetingDateTime, participants } = meeting;

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="meeting-card" onClick={() => onCardClick && onCardClick(meeting)}>
      <div className="meeting-info">
        <h3 className="meeting-title">{meetingName}</h3>
        <p className="meeting-time">{formatDateTime(meetingDateTime)}</p>
        <div className="participants-info">
          <span className="participants-icon">👥</span>
          <span className="participants-count">{participants.length}</span>
        </div>
      </div>
      <span className="status-badge">Upcoming</span>
    </div>
  );
}

export default MeetingCard;