let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioUrl;
let audioElement;

// Elements
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const statusText = document.getElementById("status");
const playButton = document.getElementById("playButton");
const hindiText = document.getElementById("hindiText");
const tamilText = document.getElementById("tamilText");
const tamilTranslitText = document.getElementById("tamilTranslitText"); // Add this element for transliteration

// Start recording
startButton.addEventListener("click", async (event) => {
    event.preventDefault(); // Prevent any default behavior that might cause reload
    startButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = "Recording...";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = sendAudioToAPI;
        mediaRecorder.start();
    } catch (err) {
        console.error("Error accessing audio:", err);
        statusText.textContent = "Error accessing microphone.";
    }
});

// Stop recording
stopButton.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent any default behavior that might cause reload
    startButton.disabled = false;
    stopButton.disabled = true;
    statusText.textContent = "Stopped recording.";

    if (mediaRecorder) {
        mediaRecorder.stop();
    }
});

// Send audio to the backend
async function sendAudioToAPI() {
    audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.wav");

    try {
        const response = await fetch("http://127.0.0.1:8000/translate-audio", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Error uploading audio");
        }

        const data = await response.json(); // Parse the JSON response

        // Log the data for debugging
        console.log("Backend Response:", data);

        data.decoded_text  = data.decoded_text .split(' ').slice(1).join(' ');

        // Show the recognized Hindi text
        hindiText.textContent = data.decoded_text || "No Hindi text recognized.";

        data.tamil_text = data.tamil_text.split(' ').slice(1).join(' ');

        // Show the translated Tamil text
        tamilText.textContent = data.tamil_text || "No Tamil translation.";

        data.tamil_transliterated_EN = data.tamil_transliterated_EN.split(' ').slice(1).join(' ');

        // Show the transliterated Tamil text in English
        tamilTranslitText.textContent = data.tamil_transliterated_EN || "No transliteration.";

        // Enable the play button and set the audio URL
        playButton.disabled = false;
        audioUrl = `http://127.0.0.1:8000/download_audio?filename=${data.audio_file}`;
    } catch (error) {
        // statusText.textContent = "Error uploading audio.";
        console.error("Error:", error);
    }

    audioChunks = []; // Clear the audio chunks after sending
}

// Play translated Tamil audio when the play button is clicked
playButton.addEventListener("click", () => {
    if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
    }
});

