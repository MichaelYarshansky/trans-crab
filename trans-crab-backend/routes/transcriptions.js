// routes/transcriptions.js

const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting'); // Import the Meeting model
const { generateMeetingInsights } = require('../services/aiService'); // Import the AI service

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
      // summary and actionItems will be filled by AI
    });

    const savedMeeting = await newMeeting.save();
    console.debug(`[transcriptions.js] New meeting transcription saved: ${savedMeeting._id}`);

    // Process with AI in the background (don't await)
    processWithAI(savedMeeting._id, transcript, participants?.length || 0);

    res.status(201).json({ message: 'Transcription saved.', transcription: savedMeeting });
  } catch (err) {
    console.error(`[transcriptions.js] Error saving transcription: ${err}`);
    res.status(500).json({ error: 'Failed to save transcription.' });
  }
});

/**
 * Process the meeting transcript with AI to generate insights
 * This runs asynchronously after the API response is sent
 */
// In the processWithAI function, let's add more detailed logging
async function processWithAI(meetingId, transcript, participantCount) {
  try {
    console.log(`[transcriptions.js] Starting AI processing for meeting ${meetingId}`);
    console.log(`[transcriptions.js] Transcript length: ${transcript.length} characters`);
    
    // Call the AI service to generate insights
    console.log(`[transcriptions.js] Calling generateMeetingInsights...`);
    const aiResponse = await generateMeetingInsights(transcript, participantCount);
    
    if (!aiResponse) {
      console.error(`[transcriptions.js] AI processing failed for meeting ${meetingId} - no response returned`);
      
      // Mark the meeting as processed but with an error
      await Meeting.findByIdAndUpdate(
        meetingId,
        { 
          isAIProcessed: true,
          summary: "AI processing failed. Please try again later.",
          updatedAt: new Date()
        }
      );
      
      return;
    }
    
    console.log(`[transcriptions.js] AI response received:`, JSON.stringify(aiResponse).substring(0, 200) + '...');
    
    if (!aiResponse.summary) {
      console.error(`[transcriptions.js] AI processing returned empty summary for meeting ${meetingId}`);
    }
    
    console.log(`[transcriptions.js] Summary length: ${aiResponse.summary?.length || 0} characters`);
    console.log(`[transcriptions.js] Action items count: ${aiResponse.actionItems?.length || 0}`);
    
    // Update the meeting with AI-generated content
    console.log(`[transcriptions.js] Updating meeting ${meetingId} with AI insights...`);
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        summary: aiResponse.summary || "",
        actionItems: aiResponse.actionItems || [],
        speakerSeparatedTranscript: aiResponse.speakerSeparatedTranscript || "",
        isAIProcessed: true, // Always mark as processed to avoid infinite loading
        updatedAt: new Date()
      },
      { new: true }
    );
    
    console.log(`[transcriptions.js] Meeting ${meetingId} updated with AI insights successfully`);
    console.log(`[transcriptions.js] Updated meeting summary length: ${updatedMeeting.summary?.length || 0}`);
  } catch (error) {
    console.error(`[transcriptions.js] Error in AI processing:`, error);
    
    // Mark the meeting as processed but with an error
    try {
      await Meeting.findByIdAndUpdate(
        meetingId,
        { 
          isAIProcessed: true,
          summary: "An error occurred during AI processing. Please try again later.",
          updatedAt: new Date()
        }
      );
    } catch (updateError) {
      console.error(`[transcriptions.js] Error updating meeting with error status:`, updateError);
    }
  }
}

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

/**
 * GET /api/transcriptions/test-ai
 * Test endpoint for the AI service
 */
router.get('/test-ai', async (req, res) => {
  try {
    console.log('[transcriptions.js] Testing AI service...');
    
    const testTranscript = "Speaker 1: Hello everyone, let's discuss our project timeline.\nSpeaker 2: I think we should aim to finish by next Friday.\nSpeaker 1: Agreed. Let's make sure everyone completes their tasks by Wednesday.";
    
    const aiResponse = await generateMeetingInsights(testTranscript, 2);
    
    if (!aiResponse) {
      return res.status(500).json({ error: 'AI service test failed - no response' });
    }
    
    res.status(200).json({ 
      message: 'AI service test successful', 
      result: aiResponse 
    });
  } catch (error) {
    console.error('[transcriptions.js] AI service test error:', error);
    res.status(500).json({ error: 'AI service test failed: ' + error.message });
  }
});

/**
 * PATCH /api/transcriptions/:id
 * Updates a meeting with new information
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingName, participants } = req.body;
    
    console.log(`[transcriptions.js] Updating meeting ${id} with:`, req.body);
    
    // Find and update the meeting
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      id,
      { 
        meetingName, 
        participants,
        // Update the timestamp
        updatedAt: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedMeeting) {
      console.log(`[transcriptions.js] Meeting not found with ID: ${id}`);
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    console.log(`[transcriptions.js] Meeting updated successfully: ${updatedMeeting._id}`);
    res.status(200).json(updatedMeeting);
  } catch (error) {
    console.error(`[transcriptions.js] Error updating meeting: ${error}`);
    res.status(500).json({ error: 'Failed to update meeting', details: error.message });
  }
});

/**
 * GET /api/transcriptions/:id
 * Returns a specific meeting by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (err) {
    console.error(`[transcriptions.js] Error retrieving meeting: ${err}`);
    res.status(500).json({ error: 'Failed to retrieve meeting' });
  }
});

/**
 * DELETE /api/transcriptions/:id
 * Deletes a meeting by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[transcriptions.js] Deleting meeting ${id}`);
    
    const deletedMeeting = await Meeting.findByIdAndDelete(id);
    
    if (!deletedMeeting) {
      console.log(`[transcriptions.js] Meeting not found with ID: ${id}`);
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    console.log(`[transcriptions.js] Meeting deleted successfully: ${id}`);
    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error(`[transcriptions.js] Error deleting meeting: ${error}`);
    res.status(500).json({ error: 'Failed to delete meeting', details: error.message });
  }
});

/**
 * POST /api/transcriptions/:id/regenerate
 * Regenerates AI content for a meeting with enhanced prompts
 */
router.post('/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    console.log(`[transcriptions.js] Regenerating AI content for meeting ${id}`);
    
    // Update meeting to show it's being processed again
    await Meeting.findByIdAndUpdate(id, { 
      isAIProcessed: false,
      updatedAt: new Date()
    });
    
    // Start regeneration in the background
    regenerateAIContent(id, meeting.transcription, meeting.participants.length);
    
    res.status(200).json({ message: 'AI regeneration started' });
  } catch (error) {
    console.error(`[transcriptions.js] Error starting regeneration: ${error}`);
    res.status(500).json({ error: 'Failed to start regeneration', details: error.message });
  }
});

/**
 * Process the meeting transcript with AI to generate enhanced insights
 * This runs asynchronously after the regenerate API response is sent
 */
async function regenerateAIContent(meetingId, transcript, participantCount) {
  try {
    console.log(`[transcriptions.js] Starting enhanced AI processing for meeting ${meetingId}`);
    
    // Call the AI service with enhanced flag
    const aiResponse = await generateMeetingInsights(transcript, participantCount, true);
    
    if (!aiResponse) {
      console.error(`[transcriptions.js] Enhanced AI processing failed for meeting ${meetingId}`);
      
      await Meeting.findByIdAndUpdate(
        meetingId,
        { 
          isAIProcessed: true, // Always mark as processed
          summary: "Enhanced AI processing failed. Please try again later.",
          updatedAt: new Date()
        }
      );
      
      return;
    }
    
    // Update the meeting with enhanced AI-generated content
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        summary: aiResponse.summary || "",
        actionItems: aiResponse.actionItems || [],
        speakerSeparatedTranscript: aiResponse.speakerSeparatedTranscript || "",
        isAIProcessed: true, // Always mark as processed
        updatedAt: new Date()
      },
      { new: true }
    );
    
    console.log(`[transcriptions.js] Meeting ${meetingId} updated with enhanced AI insights`);
  } catch (error) {
    console.error(`[transcriptions.js] Error in enhanced AI processing:`, error);
    
    try {
      await Meeting.findByIdAndUpdate(
        meetingId,
        { 
          isAIProcessed: true, // Always mark as processed
          summary: "An error occurred during enhanced AI processing. Please try again later.",
          updatedAt: new Date()
        }
      );
    } catch (updateError) {
      console.error(`[transcriptions.js] Error updating meeting with error status:`, updateError);
    }
  }
}

module.exports = router;
