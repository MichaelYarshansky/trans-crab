import React, { useState, useEffect } from 'react';
import './MeetingList.css';
import MeetingPopup from './MeetingPopup';

function MeetingList() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch meetings
  const fetchMeetings = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/transcriptions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMeetings(data.transcriptions || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings. Please try again later.');
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMeetings();
    
    // Set up periodic refresh every 10 seconds
    const refreshInterval = setInterval(fetchMeetings, 10000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Handle meeting selection
  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
  };

  // Close the popup
  const handleClosePopup = () => {
    setSelectedMeeting(null);
    // Refresh the list when closing the popup to get latest updates
    fetchMeetings();
  };

  // ... rest of your component ...
}

export default MeetingList;