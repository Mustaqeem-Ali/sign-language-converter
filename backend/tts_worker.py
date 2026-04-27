import threading
import queue
import time
import json
import io
import wave
import numpy as np
import torch
import os

# Try importing Coqui TTS.
try:
    from TTS.api import TTS
except ImportError:
    TTS = None
    print("CRITICAL: 'TTS' library not found. Please install via 'pip install tts'")

class TTSWorker(threading.Thread):
    def __init__(self, voices_path="voices.json"):
        super().__init__()
        self.daemon = True
        self.input_queue = queue.Queue()
        self.voices_path = voices_path
        
        # Default fallback settings
        self.default_speaker = "p225"
        self.model_name = "tts_models/en/vctk/vits" 
        self.model_path = None
        self.config_path = None
        
        self.sample_rate = 22050
        self.speakers_map = {} 
        self.tts = None 
        
        self._load_config()

    def _load_config(self):
        """Loads voice configuration."""
        try:
            with open(self.voices_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # 1. Load the Default Speaker ID (e.g., "p225")
                self.default_speaker = data.get("default_speaker", "p225")
                
                if "meta" in data:
                    self.model_name = data["meta"].get("model_name", self.model_name)
                    self.model_path = data["meta"].get("model_path")
                    self.config_path = data["meta"].get("config_path")
                
                if "speakers" in data:
                    for spk in data["speakers"]:
                        self.speakers_map[spk["id"]] = spk
        except Exception as e:
            print(f"[Worker] Error loading config: {e}")

    def _float_to_wav_bytes(self, float_array, sample_rate):
        if isinstance(float_array, list):
            float_array = np.array(float_array)
        float_array = np.clip(float_array, -1.0, 1.0)
        pcm_data = (float_array * 32767).astype(np.int16)
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1) 
            wav_file.setsampwidth(2) 
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data.tobytes())
        return buffer.getvalue()

    def run(self):
        print("[Worker] Thread started.")
        
        if TTS is None:
            print("[Worker] CRITICAL: Coqui TTS not installed.")
            return

        # --- PHASE 1: INITIALIZE MODEL ---
        try:
            use_gpu = torch.cuda.is_available()
            
            # Load Model
            if self.model_path and self.config_path:
                print(f"[Worker] Loading Custom VITS Model...")
                self.tts = TTS(model_path=self.model_path, config_path=self.config_path, progress_bar=False, gpu=use_gpu)
            else:
                print(f"[Worker] Loading Standard VITS Model: {self.model_name}")
                self.tts = TTS(model_name=self.model_name, progress_bar=False, gpu=use_gpu)
            
            self.sample_rate = self.tts.synthesizer.output_sample_rate
            print(f"[Worker] Model Loaded. GPU: {use_gpu} | Default Speaker: {self.default_speaker}")

            # Warmup with the default speaker
            if self.tts.is_multi_speaker:
                print(f"[Worker] Warming up with speaker: {self.default_speaker}")
                self.tts.tts("Ready.", speaker=self.default_speaker)
            else:
                self.tts.tts("Ready.")
                
            print("[Worker] System Ready.")

        except Exception as e:
            print(f"[Worker] CRITICAL: Failed to load VITS model. {e}")
            self.tts = None

        # --- PHASE 2: PROCESSING LOOP ---
        while True:
            task = self.input_queue.get()
            params, result_future = task
            
            try:
                if self.tts is None:
                    raise RuntimeError("TTS Model is not loaded.")

                text = params.get('text', '')
                
                # --- SPEAKER SELECTION LOGIC ---
                # 1. Check if user provided a specific speaker ID
                requested_speaker = params.get('speaker')
                
                # 2. If yes, use it. If no, use the default from voices.json
                if requested_speaker and requested_speaker.strip():
                    target_speaker = requested_speaker
                    # (Optional) If your JSON uses IDs different from model names, map them here.
                    # For VCTK, the ID usually IS the model name (e.g., "p225"), so direct usage works.
                else:
                    target_speaker = self.default_speaker

                print(f"[Worker] Generating Audio | Text: '{text[:10]}...' | Speaker: {target_speaker}")
                
                # --- GENERATION ---
                if self.tts.is_multi_speaker:
                    # Pass the specific ID to the model
                    wav_floats = self.tts.tts(text=text, speaker=target_speaker)
                else:
                    # If model is single speaker, we cannot use the ID
                    wav_floats = self.tts.tts(text=text)

                # --- CONVERSION ---
                audio_bytes = self._float_to_wav_bytes(wav_floats, self.sample_rate)
                
                result_future['result'] = audio_bytes
                result_future['success'] = True
                
            except Exception as e:
                print(f"[Worker] Generation failed: {e}")
                result_future['error'] = str(e)
                result_future['success'] = False
            
            finally:
                result_future['event'].set()
                self.input_queue.task_done()

    def submit_task(self, text, speaker=None, fmt="wav"):
        completion_event = threading.Event()
        result_container = {
            "event": completion_event, "success": False, "result": None, "error": None
        }
        params = {"text": text, "speaker": speaker, "format": fmt}
        self.input_queue.put((params, result_container))
        completion_event.wait()
        
        if result_container['success']:
            return result_container['result'], None
        else:
            return None, result_container['error']