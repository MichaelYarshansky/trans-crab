import React from 'react';
import './MeetingCard.css';

function MeetingCard({ meeting, onCardClick, onEditClick }) {
  const { meetingName, meetingDateTime, participants, locallyModified } = meeting;

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent card click event from firing
    onEditClick(meeting);
  };

  return (
    <div className={`meeting-card ${locallyModified ? 'locally-modified' : ''}`} onClick={() => onCardClick(meeting)}>
      <div className="meeting-info">
        <h3 className="meeting-title">
          {meetingName}
          {locallyModified && <span className="modified-badge" title="Modified locally">*</span>}
          <button 
            className="edit-button" 
            onClick={handleEditClick}
            title="Edit meeting details"
          >
            ✏️
          </button>
        </h3>
        <p className="meeting-time">{formatDateTime(meetingDateTime)}</p>
        <div className="participants-info">
          <span className="participants-icon">👥</span>
          <span className="participants-count">{participants.length}</span>
        </div>
      </div>
    </div>
  );
}

export default MeetingCard;