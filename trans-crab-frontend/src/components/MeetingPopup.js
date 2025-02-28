import React, { useState } from 'react';
import './MeetingPopup.css';

function MeetingPopup({ meeting, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  
  // Add debug logging
  console.log('Meeting data in popup:', meeting);
  console.log('Transcript:', meeting?.transcript);

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'actions', label: 'Action Items' },
    { id: 'transcript', label: 'Raw Transcript' }
  ];

  const handleNavigation = (direction) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  if (!meeting) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <h2>{meeting.meetingName}</h2>
        <p className="meeting-date">
          {new Date(meeting.meetingDateTime).toLocaleString()}
        </p>
        
        <div className="participants-section">
          <h3>Participants ({meeting.participants.length})</h3>
          <ul>
            {meeting.participants.map((participant, index) => (
              <li key={index}>{participant}</li>
            ))}
          </ul>
        </div>

        <div className="tab-navigation">
          <div className="nav-arrows">
            <button 
              className="nav-arrow prev" 
              onClick={() => handleNavigation('prev')}
              aria-label="Previous section"
            />
            <button 
              className="nav-arrow next" 
              onClick={() => handleNavigation('next')}
              aria-label="Next section"
            />
          </div>
          <h3 className="current-tab">{tabs.find(tab => tab.id === activeTab).label}</h3>
          <div className="dot-navigation">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`dot ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
              />
            ))}
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'summary' && (
            <div className="summary-section">
              <p>{meeting.summary || 'Summary will be generated soon...'}</p>
            </div>
          )}
          {activeTab === 'actions' && (
            <div className="actions-section">
              <ul className="action-items">
                {meeting.actionItems ? 
                  meeting.actionItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                  : 
                  <p>Action items will be generated soon...</p>
                }
              </ul>
            </div>
          )}
          {activeTab === 'transcript' && (
            <div className="transcript-section">
              {meeting.transcript ? (
                <pre className="transcript-text">{meeting.transcript}</pre>
              ) : (
                <p>No transcript available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingPopup;