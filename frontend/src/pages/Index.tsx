import { useState, useCallback, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useHandDetection } from "@/hooks/useHandDetection";
import { useBufferedRecorder } from "@/hooks/useBufferedRecorder";
import { useVoices } from "@/hooks/useVoices";
import { translateSignLanguage } from "@/lib/gemini";
import { speak } from "@/lib/tts";
import { DetectionIndicator } from "@/components/DetectionIndicator";
import { VoiceSelector } from "@/components/VoiceSelector";
import { ControlBar } from "@/components/ControlBar";
import { TranslationOverlay } from "@/components/TranslationOverlay";

const Index = () => {
  const { videoRef, stream, ready, error } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isHandVisible } = useHandDetection(videoRef, canvasRef, ready);
  const { voices, selectedVoice, setSelectedVoice, loading: voicesLoading } = useVoices();

  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [armed, setArmed] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const effectiveArmed = mode === "auto" ? true : armed;

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setTranslating(true);
      setTranslatedText(null);
      try {
        const text = await translateSignLanguage(blob);
        setTranslatedText(text);
        if (selectedVoice && text) {
          await speak(text, selectedVoice);
        }
      } catch (e: any) {
        console.error("Translation error:", e);
        setTranslatedText("Translation failed. Please try again.");
      } finally {
        setTranslating(false);
      }
    },
    [selectedVoice]
  );

  const { isRecording } = useBufferedRecorder({
    stream,
    isHandVisible,
    armed: effectiveArmed,
    onRecordingComplete: handleRecordingComplete,
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Camera Access Required</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Webcam feed - mirrored */}
      <video
        ref={videoRef}
        className="w-full h-screen object-cover scale-x-[-1]"
        playsInline
        muted
      />

      {/* Hand landmark overlay canvas - mirrored to match video */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-screen object-cover scale-x-[-1] pointer-events-none"
      />

      {/* Detection indicator */}
      <DetectionIndicator visible={isHandVisible} />

      {/* Voice selector */}
      <VoiceSelector
        voices={voices}
        selectedVoice={selectedVoice}
        onSelect={setSelectedVoice}
        loading={voicesLoading}
      />

      {/* Translation overlay */}
      <TranslationOverlay text={translatedText} loading={translating} />

      {/* Controls */}
      <ControlBar
        mode={mode}
        onToggleMode={() => setMode((m) => (m === "auto" ? "manual" : "auto"))}
        armed={armed}
        onToggleArm={() => setArmed((a) => !a)}
        isRecording={isRecording}
      />
    </div>
  );
};

export default Index;
