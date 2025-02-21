chrome.runtime.onMessage.addListener((message, sender) => {
    console.log("📩 Background.js received message:", message);

    if (message.action === "download_transcript" && message.transcript) {
        console.log("📥 Preparing transcript for download...");

        const blob = new Blob([message.transcript], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: `transcript_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`,
            saveAs: true
        }, () => {
            console.log("✅ Transcript file downloaded successfully.");
        });
    }
});

