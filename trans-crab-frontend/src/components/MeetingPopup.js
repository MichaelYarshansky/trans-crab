import React, { useState, useEffect } from 'react';
import './MeetingPopup.css';

const MeetingPopup = ({ meeting: initialMeeting, onClose }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [meeting, setMeeting] = useState(initialMeeting);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Add polling functionality
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // Function to refresh meeting data
  const refreshMeeting = async () => {
    if (!meeting?._id || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      console.log(`Refreshing meeting data for ${meeting._id}...`);
      
      const response = await fetch(`http://localhost:5001/api/transcriptions/${meeting._id}`);
      if (response.ok) {
        const updatedMeeting = await response.json();
        console.log('Received updated meeting data:', updatedMeeting);
        console.log('isAIProcessed flag:', updatedMeeting.isAIProcessed);
        console.log('Summary available:', Boolean(updatedMeeting.summary));
        console.log('Action items available:', Boolean(updatedMeeting.actionItems?.length));
        
        // Make sure we're using the data structure correctly
        setMeeting(updatedMeeting);
      }
    } catch (error) {
      console.error('Error refreshing meeting data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to start polling for updates
  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(() => {
      refreshMeeting();
      
      // Stop polling once the meeting is processed
      if (meeting?.isAIProcessed) {
        clearInterval(interval);
        setPollingInterval(null);
      }
    }, 5000); // Poll every 5 seconds
    
    setPollingInterval(interval);
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);
  
  // Function to handle overlay click (close popup when clicking outside)
  const handleOverlayClick = (e) => {
    if (e.target.className === 'popup-overlay') {
      onClose();
    }
  };
  
  // Function to handle delete button click
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  // Function to delete meeting
  const deleteMeeting = async () => {
    if (!meeting?._id || isDeleting) return;
    
    try {
      setIsDeleting(true);
      console.log(`Deleting meeting ${meeting._id}...`);
      
      const response = await fetch(`http://localhost:5001/api/transcriptions/${meeting._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('Meeting deleted successfully');
        onClose(); // Close the popup after successful deletion
      } else {
        console.error('Failed to delete meeting:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Function to regenerate AI content
  const regenerateAIContent = async () => {
    if (!meeting?._id || isRegenerating) return;
    
    try {
      setIsRegenerating(true);
      console.log(`Regenerating AI content for meeting ${meeting._id}...`);
      
      const response = await fetch(`http://localhost:5001/api/transcriptions/${meeting._id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Start polling for updates
        setMeeting(prev => ({ ...prev, isAIProcessed: false }));
        startPolling();
      } else {
        console.error('Failed to start regeneration');
      }
    } catch (error) {
      console.error('Error regenerating AI content:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Add debug logging
  useEffect(() => {
    console.log('Meeting data in popup:', meeting);
    console.log('AI processed status:', meeting?.isAIProcessed);
    console.log('Summary data:', meeting?.summary);
    console.log('Action items:', meeting?.actionItems);
  }, [meeting]);

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

  // Format action items for display
  const formattedActionItems = meeting.actionItems || [];
  
  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <h2>{meeting.meetingName}</h2>
        <p className="meeting-date">
          {new Date(meeting.meetingDateTime).toLocaleString()}
        </p>
        
        <div className="popup-actions">
          <button 
            className="regenerate-button" 
            onClick={regenerateAIContent}
            disabled={isRegenerating || !meeting.isAIProcessed}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate AI Analysis'}
          </button>
          
          <button 
            className="delete-button" 
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Meeting'}
          </button>
        </div>
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="delete-confirm">
            <p>Are you sure you want to delete this meeting?</p>
            <div className="delete-confirm-actions">
              <button 
                className="delete-confirm-yes" 
                onClick={deleteMeeting}
                disabled={isDeleting}
              >
                Yes, Delete
              </button>
              <button 
                className="delete-confirm-no" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Remove the AI status message - the loading spinner in each section will be enough */}
        
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
              {meeting.isAIProcessed && meeting.summary ? (
                <p style={{ whiteSpace: 'pre-wrap' }}>{meeting.summary}</p>
              ) : (
                <div className="loading-summary">
                  <p>AI is generating a summary...</p>
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'actions' && (
            <div className="actions-section">
              {meeting.isAIProcessed && meeting.actionItems && meeting.actionItems.length > 0 ? (
                <ul className="action-items">
                  {meeting.actionItems.map((item, index) => (
                    <li key={index} className="action-item">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : meeting.isAIProcessed ? (
                <p>No action items were identified in this meeting.</p>
              ) : (
                <div className="loading-actions">
                  <p>AI is analyzing action items...</p>
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'transcript' && (
            <div className="transcript-section">
              {meeting.speakerSeparatedTranscript ? (
                <pre className="transcript-text">{meeting.speakerSeparatedTranscript}</pre>
              ) : (
                <pre className="transcript-text">{meeting.transcription}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingPopup;