```python?code_reference&code_event_index=2
def generate_readme():
    content = """# LINA: Sign Language to Speech Translator 🤟🗣️

LINA is a hybrid web application designed to bridge the communication gap between sign language users and non-signers. It uses edge-based computer vision to auto-detect hand movements, translates the recorded gestures to text using Google's multimodal Gemini API, and synthesizes that text into natural, emotional speech using a local Python Text-to-Speech (TTS) backend.

## 🏗 Architecture & Tech Stack

LINA is built with a pragmatic, cost-effective, and highly stable architecture:

### 1. Frontend (The Observer)
* **Tech:** React, TypeScript, Vite, Tailwind CSS
* **Edge AI:** `@mediapipe/tasks-vision` (WebAssembly)
* **Role:** Manages the UI, accesses the webcam, and runs local AI for hand tracking to handle the complex state machine of recording without a physical "Push to Talk" button.

### 2. The Brain (Translation Engine)
* **Tech:** Google Gemini API (`gemini-2.0-flash-exp`)
* **Role:** Receives optimized WebM video blobs and outputs properly punctuated, context-aware English text.

### 3. Backend (The Voice)
* **Tech:** Python 3.10, FastAPI, Coqui TTS (XTTS v2), `espeak-ng`
* **Role:** Exposes a local REST API (`GET /voices`, `POST /tts`) to convert the text into a downloadable WAV audio blob, complete with voice cloning capabilities.

## 🚀 Key Engineering Features

* **Smart Auto-Capture:** LINA only records when hands are actively in the frame. Using MediaPipe, the system acts as a "Smart Switch," waiting for a 2.5-second cooldown after hands leave the frame before stopping the recording.
* **REST over WebSockets:** To guarantee stability and avoid rate-limiting bans (429/1011 errors) caused by "ghost connections," the system uses a synchronous Request-Response REST model.
* **Bandwidth & Token Optimization:** The frontend forces the camera constraint to `320x240 @ 15fps`, reducing network payloads by over 90% and significantly lowering Gemini API token usage.
* **Latency Masking:** To keep the UX feeling real-time, the app plays local audio cues ("Pings") immediately before backend requests to mask API response times.

## 🛠 Prerequisites

Before running the application, ensure you have the following installed:
1. **Node.js** (v18+)
2. **Python** (Strictly **3.10** recommended for Coqui TTS compatibility)
3. **eSpeak-ng** (Required for the TTS phonemizer to work):
   * *Windows:* Download the `.msi` from the [eSpeak-ng GitHub Releases](https://github.com/espeak-ng/espeak-ng/releases) (Ensure "Add to PATH" is checked).
   * *macOS:* `brew install espeak`
   * *Linux:* `sudo apt-get install espeak-ng`
4. A **Google Gemini API Key** (Make sure you create this in [Google AI Studio](https://aistudio.google.com/)).

## 💻 Installation & Setup

### 1. Setup the Backend (Python)
Open a terminal and navigate to the `backend` folder:
```
```text?code_stdout&code_event_index=2
README.md created successfully.

```bash
cd backend
python -m venv venv

# Activate the virtual environment
# Windows:
.\\venv\\Scripts\\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install "numpy<2.0" scipy fastapi uvicorn coqui-tts
```

Make sure you have a short `.wav` file named `reference.wav` inside the `backend` folder for voice cloning to use!

Start the server:
```bash
python server.py
```
*(The server will run on `http://localhost:8000`)*

### 2. Setup the Frontend (React)
Open a new terminal and navigate to your project root (or `frontend` folder):
```bash
npm install
```

Create a `.env` file in the root of the frontend folder and add your Gemini API Key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Start the development server:
```bash
npm run dev
```

## 🔄 How It Works (The Workflow)

1. **Arming:** Click "Start Translation". The camera activates, but recording does **not** start yet.
2. **Trigger:** Raise your hands. MediaPipe detects them and triggers `MediaRecorder`.
3. **Cooldown:** Lower your hands. A 2.5-second timer starts. If hands aren't detected again, recording stops.
4. **Translation:** The video is converted to Base64 and POSTed to Gemini 2.0.
5. **Synthesis:** The resulting text is POSTed to the local FastAPI backend (`/tts`).
6. **Playback:** The backend returns a binary WAV file which is immediately played by the browser.

## 🤝 Acknowledgments
Built to make communication seamless, leveraging modern LLMs, Edge AI, and Open-Source TTS models.
"""
    with open("README.md", "w", encoding="utf-8") as f:
        f.write(content)
    return "README.md created successfully."

print(generate_readme())

```
Your Markdown file is ready
[file-tag: code-generated-file-0-1777282191842627179]

I have generated a professional `README.md` file for your LINA project. It includes the complete architecture, the tech stack, the prerequisites (especially the critical `eSpeak-ng` dependency and Python 3.10 requirement), and the full workflow we discussed. 

This is perfect for dropping straight into your GitHub repository so that interviewers or collaborators understand exactly what problems you solved and how to set it up!
