# Trans-Crab 🦀

Trans-Crab is a Chrome extension that transcribes online meeting calls (Google Meet and Zoom) and saves the text as a `.txt` file. It provides **real-time Hebrew transcription**, an intuitive interface, and a synchronized timer to track recording duration.

## 📌 Features
- **Real-time speech-to-text** (Supports **Hebrew**)
- **Zoom support**: Works on both Google Meet and Zoom
- **Improved Popup UI**: Modern design with a clean, user-friendly interface
- **Accurate Timer**: Fixed synchronization issue so the timer reflects true transcription duration
- **Single-button Operation**: Easily start and stop transcription
- **Automatic File Download**: The transcript is saved as a text file upon stopping

## 🚀 Installation

### **🔧 Load the Extension in Chrome**
1. **Download the repository**  
   ```bash
   git clone <this_repo>
   cd trans-crab
Open Chrome Extensions Page
Go to: chrome://extensions/
Enable Developer Mode (top-right corner).
Load Unpacked Extension
Click "Load unpacked".
Select the trans-crab folder you cloned.
Pin the Extension
Click the 🧩 puzzle icon in Chrome.
Find Trans-Crab and 📌 pin it to the toolbar.
🎙️ How to Use
Open a Google Meet or Zoom call
Google Meet: https://meet.google.com/
Zoom: Open your Zoom meeting in your browser
Click the Trans-Crab 🦀 icon in your toolbar.
Click "▶️ Start Transcribing"
The timer will begin to track the transcription duration.
Click "⏹️ Stop Transcribing"
A text file with your transcription will automatically download.
⚙️ Technical Details
Language: he-IL (Hebrew) & en-US (English)
Speech Recognition API: Utilized for real-time transcription
Manifest V3: Extension built on the latest Chrome extension architecture
Platform Support: Works on both Google Meet and Zoom
Manual Stop: Transcription stops only when manually triggered to avoid false terminations
🏗 Project Structure
bash
Copy
trans-crab/
│── icons/             # Crab icons (16x16, 32x32, 48x48, 128x128)
│── popup.html         # The extension's popup UI
│── popup.js           # Controls popup behavior (button, timer, state)
│── styles.css         # Popup UI styling
│── content.js         # Injected script for transcribing speech
│── background.js      # Handles file saving & communication
│── manifest.json      # Chrome extension manifest
│── README.md          # This file
🤝 Want to Contribute?
Feel free to fork the repo and submit a pull request with your improvements or feature suggestions!

🦀 About Trans-Crab
Trans-Crab was built to simplify meeting transcriptions with an intuitive UI, automatic file downloads, and support for Hebrew. Enjoy a seamless transcription experience on both Google Meet and Zoom!

If you find Trans-Crab useful, ⭐ Star the repo and spread the word! 🚀

📜 License
MIT License – You can use and modify this freely.

🎉 Credits
Made with ❤️ by [@MichaelYarshansky] and the Crab Devs Community.
Inspired by the need for simple, efficient meeting transcriptions!

🎉 Enjoy Trans-Crab! 🦀🎙️
