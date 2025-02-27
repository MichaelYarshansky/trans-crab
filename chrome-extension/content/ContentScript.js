// content/ContentScript.js

console.debug("🦀 ContentScript.js loaded as a module.");

// Dynamically import your classes from the correct paths:
import { TranscriptManager } from "../models/TranscriptManager.js";
import { MetadataService } from "../services/MetadataService.js";
import { TranscriptionService } from "../services/TranscriptionService.js";
import { MessageHandler } from "../services/MessageHandler.js";
import { BackendService } from "../services/BackendService.js";

// Then instantiate:
const transcriptManager = new TranscriptManager();
const transcriptionService = new TranscriptionService(transcriptManager);
const messageHandler = new MessageHandler(transcriptionService);

// Optionally attach if needed:
window.BackendService = BackendService;
window.MetadataService = MetadataService;
