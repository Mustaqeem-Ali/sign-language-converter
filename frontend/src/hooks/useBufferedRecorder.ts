import { useRef, useEffect, useCallback, useState } from "react";

interface Options {
  stream: MediaStream | null;
  isHandVisible: boolean;
  armed: boolean; // in manual mode, must be armed; in auto, always true
  onRecordingComplete: (blob: Blob) => void;
}

export function useBufferedRecorder({ stream, isHandVisible, armed, onRecordingComplete }: Options) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimerRef = useRef<number | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);

  const START_DELAY = 1000;
  const STOP_DELAY = 1500;

  const clearStartTimer = useCallback(() => {
    if (startTimerRef.current !== null) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
  }, []);

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current !== null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!stream || isRecordingRef.current) return;
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      if (blob.size > 0) onRecordingComplete(blob);
      chunksRef.current = [];
    };
    recorder.start(100);
    recorderRef.current = recorder;
    isRecordingRef.current = true;
    setIsRecording(true);
  }, [stream, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!armed || !stream) {
      clearStartTimer();
      clearStopTimer();
      if (isRecordingRef.current) stopRecording();
      return;
    }

    if (isHandVisible) {
      // Hand appeared
      clearStopTimer();
      if (!isRecordingRef.current && startTimerRef.current === null) {
        startTimerRef.current = window.setTimeout(() => {
          startTimerRef.current = null;
          startRecording();
        }, START_DELAY);
      }
    } else {
      // Hand disappeared
      clearStartTimer();
      if (isRecordingRef.current && stopTimerRef.current === null) {
        stopTimerRef.current = window.setTimeout(() => {
          stopTimerRef.current = null;
          stopRecording();
        }, STOP_DELAY);
      }
    }
  }, [isHandVisible, armed, stream, clearStartTimer, clearStopTimer, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearStartTimer();
      clearStopTimer();
      if (isRecordingRef.current) stopRecording();
    };
  }, [clearStartTimer, clearStopTimer, stopRecording]);

  return { isRecording };
}
