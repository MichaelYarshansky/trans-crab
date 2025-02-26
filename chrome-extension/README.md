# Trans-Crab 🦀  

Google Meet Transcriber  

**Trans-Crab** is a Chrome extension that automatically transcribes **Google Meet** calls and saves the text as a `.txt` file. It provides **real-time Hebrew transcription**, an easy-to-use interface, and a timer to track your recording duration.  

## 📌 Features  
✅ **Real-time speech-to-text** (Supports **Hebrew**)  
✅ **Single-button operation** – Start & Stop transcribing with ease  
✅ **Automatic file download** of transcriptions  
✅ **Live timer** to track transcription time  
✅ **Minimalistic UI with a cute crab icon**  

---

## 🚀 Installation  

### **🔧 Load the Extension in Chrome**  
1. **Download the repository**  
   ```bash
   git clone <this_repo>
   cd trans-crab
   ```
2. **Open Chrome Extensions Page**  
   - Go to: [`chrome://extensions/`](chrome://extensions/)  
   - Enable **Developer Mode** (top-right corner).  
3. **Load Unpacked Extension**  
   - Click `"Load unpacked"`.  
   - Select the **trans-crab folder** you cloned.  
4. **Pin the extension**  
   - Click the 🧩 **puzzle icon** in Chrome.  
   - Find **Trans-Crab** and 📌 **pin it** to the toolbar.  

---

## 🎙️ How to Use  

1. **Open a Google Meet call** at [`https://meet.google.com/`](https://meet.google.com/)  
2. Click the **Trans-Crab 🦀 icon** in your toolbar.  
3. Click **"▶️ Start Transcribing"**  
   - The timer will start counting your recording time.  
4. Click **"⏹️ Stop Transcribing"**  
   - **A text file** with your transcription will automatically download.  

---

## ⚙️ Technical Details  

- **Language:** `he-IL` (Hebrew) & 'en-US' (English)
- **Speech Recognition API** is used for transcription  
- **Manifest V3** extension format  
- **Works only on Google Meet (`meet.google.com`)**  

---

### 🏗 **Project Structure**  
```bash
trans-crab/
│── icons/             # Crab icons (16x16, 32x32, 48x48, 128x128)
│── popup.html         # The extension's popup UI
│── popup.js           # Controls popup behavior (button, timer, state)
│── styles.css         # Popup UI styling
│── content.js         # Injected script for transcribing speech
│── background.js      # Handles file saving & communication
│── manifest.json      # Chrome extension manifest
│── README.md          # This file
```

### 🤝 **Want to Contribute?**  
Feel free to **fork the repo** and submit a **pull request**!  

---

## 🦀 About the Project  

Trans-Crab was built to **simplify Google Meet transcriptions** with an **intuitive UI, automatic downloads, and support for Hebrew**.  

If you found this useful, **⭐ Star the repo** and **spread the word**! 🚀  

## Future features: 
* Fine-tuned transcription model
* Meeting summary with action items
* CRM integration
* Web interface
* anything our users asks for (:
  
---

## 📜 License  

MIT License – You can use and modify this freely.  

---

## 🎉 Credits  

Made with ❤️ by **[@MichaelYarshansky]** and the **Crab Devs Community**.  
🔥 Inspired by the need for simple, efficient meeting transcriptions!  

---

### 🎉 **Enjoy Trans-Crab! 🦀🎙️**  
