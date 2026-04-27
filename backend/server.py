import json
import threading
from typing import Optional
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from tts_worker import TTSWorker

# Configuration
VOICES_PATH = "data/voices.json"
GLOBAL_VOICES_DATA = {}

app = FastAPI(title="Threaded TTS Backend")

# Add CORS middleware to allow all requests from clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize the Worker
worker = TTSWorker(voices_path=VOICES_PATH)

# A Lock to enforce "Single Job" behavior (503 Service Unavailable)
# If we didn't use this, requests would queue up and the client might time out.
worker_busy_lock = threading.Lock()

class TTSRequest(BaseModel):
    text: str
    speaker: Optional[str] = None
    format: Optional[str] = "wav"

@app.on_event("startup")
async def startup_event():
    # 1. Load JSON for /voices endpoint
    global GLOBAL_VOICES_DATA
    try:
        with open(VOICES_PATH, "r", encoding="utf-8") as f:
            GLOBAL_VOICES_DATA = json.load(f)
    except Exception as e:
        print(f"Error loading voices.json: {e}")

    # 2. Start the Worker Thread
    # It will immediately begin its "warm up" routine
    worker.start()

@app.get("/voices")
async def get_voices():
    if not GLOBAL_VOICES_DATA:
        return Response(content='{"error": "voices not available"}', status_code=500, media_type="application/json")
    return GLOBAL_VOICES_DATA

@app.post("/tts")
async def generate_tts(request: TTSRequest):
    # 1. Validation
    if not request.text or not request.text.strip():
        return Response(content='{"error": "text must be provided"}', status_code=400, media_type="application/json")
    
    if request.format != "wav":
        return Response(content='{"error": "unsupported format"}', status_code=400, media_type="application/json")

    # 2. Check availability (Non-blocking acquire)
    if not worker_busy_lock.acquire(blocking=False):
        return Response(
            content='{"error": "TTS worker is busy; try again shortly"}',
            status_code=503,
            media_type="application/json"
        )

    try:
        # 3. Submit to Worker Thread (Synchronous wait for result)
        # We hold the lock during this entire wait to block other users
        audio_data, error = worker.submit_task(request.text, request.speaker, request.format)

        if error:
            return Response(content=json.dumps({"error": error}), status_code=500, media_type="application/json")

        # 4. Return Audio
        headers = {"Content-Disposition": 'attachment; filename="tts.wav"'}
        return Response(content=audio_data, media_type="audio/wav", headers=headers)

    finally:
        # 5. Release Lock
        worker_busy_lock.release()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)