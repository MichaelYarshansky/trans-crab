import React, { useState, useEffect } from 'react';
import MeetingCard from './components/MeetingCard';
import MeetingPopup from './components/MeetingPopup';
import Settings from './components/Settings';
import EditMeetingPopup from './components/EditMeetingPopup';
import './App.css';

function App() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Update state to handle settings menu
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  // Update isPopupOpen state when a popup is shown or closed
  useEffect(() => {
    setIsPopupOpen(selectedMeeting !== null || editingMeeting !== null || showSettings);
  }, [selectedMeeting, editingMeeting, showSettings]);

  const fetchMeetings = () => {
    setLoading(true);
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
        
        // Sort meetings from newest to oldest
        const sortedMeetings = processedMeetings?.sort((a, b) => {
          // Try to use createdAt or date field for sorting
          const dateA = new Date(a.createdAt || a.date || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.date || b.timestamp || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        setMeetings(sortedMeetings || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching meetings:", err);
        setError(err);
        setLoading(false);
      });
  };

  const handleCardClick = (meeting) => {
    console.log('Selected meeting data:', meeting);
    setSelectedMeeting(meeting);
  };

  const handleEditClick = (meeting) => {
    console.log('Editing meeting:', meeting);
    setEditingMeeting(meeting);
  };

  const handleSaveEdit = async (updatedMeeting) => {
    try {
      console.log('Saving updated meeting:', updatedMeeting);
      
      // Check if we have the correct ID field
      const meetingId = updatedMeeting._id || updatedMeeting.id;
      
      if (!meetingId) {
        throw new Error('Meeting ID is missing');
      }
      
      // Create a payload that matches what the backend expects
      const payload = {
        meetingName: updatedMeeting.meetingName,
        participants: updatedMeeting.participants
      };
      
      console.log('Sending payload to API:', payload);
      
      // Try to update the server first
      const response = await fetch(`http://localhost:5001/api/transcriptions/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Server update response:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      // Update the meeting in the local state
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => 
          (meeting._id === meetingId || meeting.id === meetingId) 
            ? {
                ...meeting, 
                meetingName: updatedMeeting.meetingName, 
                participants: updatedMeeting.participants
              } 
            : meeting
        )
      );
      
      // Close the edit popup
      setEditingMeeting(null);
      
      // Show success message
      alert('Meeting updated successfully in the database.');
    } catch (err) {
      console.error('Error updating meeting:', err);
      alert(`Failed to update meeting: ${err.message}`);
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Fix the settings gear icon path which has a typo
  const handleDownloadExtension = () => {
    window.open('https://chrome.google.com/webstore/detail/trans-crab-extension/your-extension-id', '_blank');
  };

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleSettingsOption = (option) => {
    setShowSettingsMenu(false);
    
    switch(option) {
      case 'crm':
        alert('Connect CRM functionality will be implemented here');
        break;
      case 'whatsapp':
        alert('Connect WhatsApp functionality will be implemented here');
        break;
      case 'model':
        alert('Choose a model functionality will be implemented here');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="task-bar">
        <div className="task-bar-left">
          <div className="logo-container">
            <a href="/" className="logo">
              <span>Trans</span><span className="accent">Crab</span>
              <span className="emoji" role="img" aria-label="Crab">🦀</span>
            </a>
          </div>
        </div>
        <div className="task-bar-right">
          <button 
            className="task-bar-button with-text" 
            title="Download Extension"
            onClick={handleDownloadExtension}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm9-9v11c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4v2H5v11h14V7h-4V5h4c1.1 0 2 .9 2 2z" />
            </svg>
            <span>Download Extension</span>
          </button>
          <div className="settings-container">
            <button 
              className="task-bar-button with-text" 
              title="Settings"
              onClick={handleSettingsClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13-.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c.19.15.24.42.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
              </svg>
              <span>Settings</span>
            </button>
            {showSettingsMenu && (
              <div className="settings-menu">
                <button 
                  className="settings-menu-item" 
                  onClick={() => handleSettingsOption('crm')}
                >
                  Connect CRM
                </button>
                <button 
                  className="settings-menu-item" 
                  onClick={() => handleSettingsOption('whatsapp')}
                >
                  Connect WhatsApp
                </button>
                <button 
                  className="settings-menu-item" 
                  onClick={() => handleSettingsOption('model')}
                >
                  Choose a Model
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={`app-container ${isPopupOpen ? 'popup-active' : ''}`}>
        <header className="app-header">
          <h1>
            Trans<span className="accent">Crab</span> 
            <span className="subtitle-inline">Meeting Transcriptions</span>
            <span className="crab-emoji" role="img" aria-label="Crab">🦀</span>
          </h1>
        </header>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your meetings...</p>
          </div>
        ) : error ? (
          <div className="error">Error loading meetings: {error.message}</div>
        ) : (
          <div className="meetings-grid">
            {meetings.map((meeting) => (
              <MeetingCard 
                key={meeting._id || meeting.id} 
                meeting={meeting}
                onCardClick={handleCardClick}
                onEditClick={handleEditClick}
              />
            ))}
          </div>
        )}

        {selectedMeeting && (
          <MeetingPopup 
            meeting={selectedMeeting} 
            onClose={() => setSelectedMeeting(null)}
          />
        )}

        {editingMeeting && (
          <EditMeetingPopup
            meeting={editingMeeting}
            onSave={handleSaveEdit}
            onCancel={() => setEditingMeeting(null)}
          />
        )}
        
        {showSettings && (
          <div className="popup-overlay">
            <div className="settings-popup">
              <div className="popup-header">
                <h2>Settings</h2>
                <button className="close-button" onClick={() => setShowSettings(false)}>×</button>
              </div>
              <div className="settings-content">
                <Settings onClose={() => setShowSettings(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
