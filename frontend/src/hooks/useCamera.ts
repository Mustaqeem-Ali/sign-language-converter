import { useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 854, height: 480, facingMode: "user" },
          audio: false,
        });
        if (cancelled) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e: any) {
        setError(e.message ?? "Camera access denied");
      }
    })();
    return () => {
      cancelled = true;
      setStream(prev => {
        prev?.getTracks().forEach(t => t.stop());
        return null;
      });
    };
  }, []);

  return { videoRef, stream, ready, error };
}
