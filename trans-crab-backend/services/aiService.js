// services/aiService.js

const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generates meeting insights using OpenAI's GPT model
 * @param {string} transcript - The meeting transcript
 * @param {number} participantCount - Number of participants in the meeting
 * @param {boolean} enhanced - Whether to use enhanced prompting
 * @returns {Object} Object containing summary, actionItems, and speakerSeparatedTranscript
 */
async function generateMeetingInsights(transcript, participantCount, enhanced = false) {
  if (!OPENAI_API_KEY) {
    console.error('[aiService] OpenAI API key not found in environment variables');
    return null;
  }

  try {
    console.log('[aiService] Preparing to send transcript to OpenAI API...');
    console.log(`[aiService] Transcript length: ${transcript.length} characters, Participant count: ${participantCount}`);
    console.log(`[aiService] Using ${enhanced ? 'enhanced' : 'standard'} prompting`);
    
    // Detect if the transcript is primarily in Hebrew
    const isHebrew = containsHebrew(transcript);
    console.log(`[aiService] Transcript language detected: ${isHebrew ? 'Hebrew' : 'English'}`);
    
    let systemPrompt = '';
    
    if (enhanced) {
      systemPrompt = `You are an expert meeting analyst who specializes in ${isHebrew ? 'Hebrew' : 'English'} business communications.
      Your task is to perform a detailed analysis of this meeting transcript:
      
      1. Carefully separate the transcript by speakers, identifying each unique voice based on context, speaking patterns, and meeting flow. There are approximately ${participantCount} participants.
      
      2. Create a comprehensive yet concise meeting summary that:
         - Identifies the main purpose and objectives of the meeting
         - Highlights key decisions made and their rationale
         - Captures important discussions, disagreements, and resolutions
         - Summarizes the strategic direction established
         - Notes any critical information shared
         - DO NOT include speaker references in the summary - write it as a cohesive narrative
         - Focus on key insights, ideas, and missions discussed
         - Be detailed yet precise
      
      3. Extract a detailed, prioritized action items list that:
         - Assigns each action to specific speakers when possible
         - Uses @everybody for general actions
         - Includes deadlines mentioned
         - Ranks items by importance and urgency
         - Provides context for why each action matters
      
      ${isHebrew ? 'Please analyze the Hebrew text and respond in Hebrew, maintaining cultural context and nuances.' : ''}
      
      Return your analysis in the following JSON format:
      {
        "speakerSeparatedTranscript": "The transcript with clear speaker labels [Speaker 1], [Speaker 2], etc. This will replace the raw transcript in the UI.",
        "summary": "Comprehensive meeting summary including key points and conclusions without any speaker references",
        "actionItems": ["<Speaker 1>: Action 1", "<Speaker 2>: Action 2", "<@everybody>: General action"]
      }`;
    } else {
      systemPrompt = `You are an AI assistant that analyzes meeting transcripts in ${isHebrew ? 'Hebrew' : 'English'}. 
      Your task is to perform the following 3 actions:
      
      1. Separate the transcript by speakers based on context and meeting flow. There are approximately ${participantCount} participants.
      
      2. Create a concise meeting summary that:
         - Captures key ideas, missions, and subjects discussed
         - Does NOT include speaker references - write it as a cohesive narrative
         - Focuses on insights and important points
         - Is detailed yet precise
         - Ends with a brief mention of next steps (without attributing them to speakers)
      
      3. Create an action items list organized by speaker. Use @everybody for general actions. Sort the actions items by their importance level.
      
      ${isHebrew ? 'Please analyze the Hebrew text and respond in Hebrew.' : ''}
      
      Return your analysis in the following JSON format:
      {
        "speakerSeparatedTranscript": "The transcript with clear speaker labels [Speaker 1], [Speaker 2], etc. This will replace the raw transcript in the UI.",
        "summary": "Comprehensive meeting summary including key points and conclusions without any speaker references",
        "actionItems": ["<Speaker 1>: Action 1", "<Speaker 2>: Action 2", "<@everybody>: General action"]
      }`;
    }
    
    const requestPayload = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: enhanced ? 0.7 : 0.9, // Slightly lower temperature for enhanced mode
      max_tokens: 5000
    };
    
    console.log('[aiService] Sending request to OpenAI API now...');
    console.log('[aiService] API Key present:', !!OPENAI_API_KEY);
    
    const response = await axios.post(
      OPENAI_API_URL,
      requestPayload,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minute timeout
      }
    );

    // Parse the response
    console.log('[aiService] Received response from OpenAI with status:', response.status);
    
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error('[aiService] Unexpected response structure:', JSON.stringify(response.data));
      return null;
    }
    
    const aiResponse = response.data.choices[0].message.content;
    console.log('[aiService] Raw AI response:', aiResponse.substring(0, 200) + '...');
    
    try {
      // Try to parse the JSON response
      console.log('[aiService] Attempting to parse JSON response...');
      
      // First, try to extract JSON if the response contains text before or after the JSON
      let jsonStr = aiResponse;
      
      // Look for JSON-like patterns
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
        console.log('[aiService] Extracted JSON-like structure from response');
      }
      
      const parsedResponse = JSON.parse(jsonStr);
      console.log('[aiService] Successfully parsed JSON response');
      
      return {
        speakerSeparatedTranscript: parsedResponse.speakerSeparatedTranscript || '',
        summary: parsedResponse.summary || '',
        actionItems: parsedResponse.actionItems || []
      };
    } catch (parseError) {
      console.error('[aiService] Error parsing AI response:', parseError);
      console.log('[aiService] Attempting to extract data using regex...');
      // Attempt to extract data using regex if JSON parsing fails
      return extractDataWithRegex(aiResponse);
    }
  } catch (error) {
    console.error('[aiService] Error calling OpenAI API:', error.message);
    if (error.response) {
      console.error('[aiService] Response status:', error.response.status);
      console.error('[aiService] Response data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('[aiService] No response received. Request:', error.request);
    }
    return null;
  }
}

/**
 * Helper function to detect if text contains Hebrew characters
 * @param {string} text - The text to check
 * @returns {boolean} True if the text contains Hebrew characters
 */
function containsHebrew(text) {
  // Hebrew Unicode range: \u0590-\u05FF
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

/**
 * Fallback function to extract data using regex if JSON parsing fails
 * @param {string} text - The raw text response from OpenAI
 * @returns {Object} Extracted data
 */
function extractDataWithRegex(text) {
  // Default empty values
  const result = {
    speakerSeparatedTranscript: '',
    summary: '',
    actionItems: []
  };

  // Try to extract summary - improved regex patterns
  let summaryMatch = text.match(/summary"?\s*:?\s*"([^"]*)"/i);
  if (!summaryMatch) {
    // Try to find a summary section without JSON formatting
    summaryMatch = text.match(/summary:?\s*([\s\S]*?)(?=action items:|speaker|$)/i);
  }
  
  if (summaryMatch && summaryMatch[1]) {
    // Clean up the summary - remove speaker references if present
    let summary = summaryMatch[1].trim().replace(/\\n/g, '\n').replace(/\\"/g, '"');
    
    // Remove speaker references like [Speaker 1], Speaker 1:, etc.
    summary = summary.replace(/\[Speaker \d+\]:|Speaker \d+:|<Speaker \d+>:/gi, '');
    summary = summary.replace(/\[Speaker \d+\]|Speaker \d+|<Speaker \d+>/gi, '');
    
    // Clean up any double spaces or empty lines created by the replacements
    summary = summary.replace(/\n\s*\n/g, '\n\n').replace(/  +/g, ' ').trim();
    
    result.summary = summary;
  } else {
    // If no summary section found, use the whole text as summary but clean it up
    let summary = "AI generated a non-structured response. Here's the key points:\n\n" + text;
    
    // Remove speaker references
    summary = summary.replace(/\[Speaker \d+\]:|Speaker \d+:|<Speaker \d+>:/gi, '');
    summary = summary.replace(/\[Speaker \d+\]|Speaker \d+|<Speaker \d+>/gi, '');
    
    // Clean up any double spaces or empty lines
    summary = summary.replace(/\n\s*\n/g, '\n\n').replace(/  +/g, ' ').trim();
    
    result.summary = summary;
  }

  // Try to extract speaker separated transcript
  const transcriptMatch = text.match(/speakerSeparatedTranscript"?\s*:?\s*"([^"]*)"/i);
  if (transcriptMatch && transcriptMatch[1]) {
    result.speakerSeparatedTranscript = transcriptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  } else {
    // If no speaker separated transcript found, try to create one from the original text
    // This is a fallback that attempts to identify speaker patterns
    const lines = text.split('\n');
    const speakerLines = lines.map(line => {
      // Look for speaker patterns like "Speaker 1:" or similar
      const speakerMatch = line.match(/^(Speaker \d+|Person \d+|Participant \d+):/i);
      if (speakerMatch) {
        return line; // Already has speaker label
      }
      
      // Try to detect if this might be a new speaker based on context
      if (line.trim().length > 0 && !line.startsWith('-') && !line.startsWith('*')) {
        // This is a heuristic - in a real implementation, you'd want more sophisticated speaker detection
        return line;
      }
      
      return line;
    });
    
    result.speakerSeparatedTranscript = speakerLines.join('\n');
  }

  // Try to extract action items - improved regex
  let actionItems = [];
  
  // First try JSON format
  const actionItemsMatch = text.match(/actionItems"?\s*:?\s*\[(.*?)\]/s);
  if (actionItemsMatch && actionItemsMatch[1]) {
    const actionItemsString = actionItemsMatch[1];
    const items = actionItemsString.match(/"([^"]*)"/g);
    if (items) {
      actionItems = items.map(item => 
        item.replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, '\n').replace(/\\"/g, '"')
      );
    }
  }
  
  // If no action items found in JSON format, try to extract from text
  if (actionItems.length === 0) {
    const actionSection = text.match(/action items:?\s*([\s\S]*?)(?=summary:|speaker|$)/i);
    if (actionSection && actionSection[1]) {
      // Split by lines and look for bullet points or numbered items
      const lines = actionSection[1].split('\n');
      actionItems = lines
        .filter(line => line.trim().match(/^[-*•]|\d+\.|\<.*\>:/))
        .map(line => line.trim());
    }
  }
  
  result.actionItems = actionItems;

  console.log('[aiService] Extracted data using regex:', {
    summaryLength: result.summary.length,
    transcriptLength: result.speakerSeparatedTranscript.length,
    actionItemsCount: result.actionItems.length
  });

  return result;
}

module.exports = {
  generateMeetingInsights
};