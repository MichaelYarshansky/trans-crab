// models/Meeting.js

const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema(
  {
    meetingName: {
      type: String,
      required: true,
    },
    meetingDateTime: {
      type: Date,
      required: true,
    },
    participants: {
      type: [String],
      default: [],
    },
    user: {
      type: String, // e.g., Google user ID or email
      required: true,
    },
    transcription: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      default: "", // AI-generated summary, if available
    },
    actionItems: {
      type: [String],
      default: [], // List of action items
    },
    meetingUniqueId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Meeting', MeetingSchema);
