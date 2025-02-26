// routes/transcriptions.js

const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting'); // Import the Meeting model

/**
 * POST /api/transcriptions
 * Receives transcription data from the extension and saves a meeting.
 */
router.post('/', async (req, res) => {
  const { transcript, meetingName, meetingDateTime, participants, meetingUniqueId } = req.body;

  if (!transcript || transcript.trim() === '') {
    return res.status(400).json({ error: 'Transcript data is required.' });
  }

  // Use dummy values for user and meetingUniqueId if not provided
  const user = req.body.user || "dummy_user_id";
  const uniqueId = meetingUniqueId || "dummy_meeting_id_" + Date.now();

  try {
    const newMeeting = new Meeting({
      meetingName: meetingName || "Untitled Meeting",
      meetingDateTime: meetingDateTime ? new Date(meetingDateTime) : new Date(),
      participants: participants || [],
      user,
      transcription: transcript,
      meetingUniqueId: uniqueId,
      // summary and actionItems can be filled later or remain defaults
    });

    const savedMeeting = await newMeeting.save();

    console.debug(`[transcriptions.js] New meeting transcription saved: ${JSON.stringify(savedMeeting)}`);

    res.status(201).json({ message: 'Transcription saved.', transcription: savedMeeting });
  } catch (err) {
    console.error(`[transcriptions.js] Error saving transcription: ${err}`);
    res.status(500).json({ error: 'Failed to save transcription.' });
  }
});

/**
 * GET /api/transcriptions
 * Returns all transcriptions.
 */
router.get('/', async (req, res) => {
  try {
    const meetings = await Meeting.find();
    res.json({ transcriptions: meetings });
  } catch (err) {
    console.error(`[transcriptions.js] Error retrieving transcriptions: ${err}`);
    res.status(500).json({ error: 'Failed to retrieve transcriptions.' });
  }
});

module.exports = router;
