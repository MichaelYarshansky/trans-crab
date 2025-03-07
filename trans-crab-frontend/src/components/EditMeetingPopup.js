import React, { useState } from 'react';
import './EditMeetingPopup.css';

function EditMeetingPopup({ meeting, onSave, onCancel }) {
  const [meetingName, setMeetingName] = useState(meeting.meetingName || '');
  const [participants, setParticipants] = useState([...(meeting.participants || [])]);
  const [newParticipant, setNewParticipant] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddParticipant = () => {
    if (newParticipant.trim()) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const handleRemoveParticipant = (index) => {
    const updatedParticipants = [...participants];
    updatedParticipants.splice(index, 1);
    setParticipants(updatedParticipants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Create updated meeting object
      const updatedMeeting = {
        ...meeting,
        meetingName,
        participants
      };
      
      // Call the onSave function passed from parent
      await onSave(updatedMeeting);
    } catch (error) {
      console.error('Error saving meeting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  return (
    <div className="edit-popup-overlay">
      <div className="edit-popup">
        <div className="edit-popup-header">
          <h2>Edit Meeting Details</h2>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onCancel}
            aria-label="Close"
          >
            <span role="img" aria-hidden="true">✕</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="meetingName">Meeting Name</label>
            <input
              type="text"
              id="meetingName"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              className="form-control"
              placeholder="Enter meeting name"
              required
            />
          </div>

          <div className="form-group">
            <label>Participants</label>
            {participants.length > 0 ? (
              <ul className="participants-list">
                {participants.map((participant, index) => (
                  <li key={index} className="participant-item">
                    <span>{participant}</span>
                    <button 
                      type="button" 
                      className="remove-participant" 
                      onClick={() => handleRemoveParticipant(index)}
                      aria-label={`Remove ${participant}`}
                    >
                      <span role="img" aria-hidden="true">✕</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-participants">No participants added yet</p>
            )}

            <div className="add-participant">
              <input
                type="text"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add new participant"
                className="form-control"
              />
              <button 
                type="button" 
                className="add-participant-btn"
                onClick={handleAddParticipant}
                disabled={!newParticipant.trim()}
                aria-label="Add participant"
              >
                <span role="img" aria-hidden="true">+</span>
              </button>
            </div>
          </div>

          <div className="popup-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={isSaving || !meetingName.trim()}
            >
              {isSaving ? (
                <span className="saving-indicator">
                  <span className="saving-spinner"></span>
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMeetingPopup;