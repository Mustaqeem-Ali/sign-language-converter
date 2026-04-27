import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function useHandDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  ready: boolean
) {
  const [isHandVisible, setIsHandVisible] = useState(false);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const onResults = useCallback((results: any) => {
    const hasHands = (results.multiHandLandmarks?.length ?? 0) > 0;
    setIsHandVisible(hasHands);

    // Draw landmarks on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && window.drawConnectors && window.drawLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: "#00FF88",
          lineWidth: 2,
        });
        window.drawLandmarks(ctx, landmarks, {
          color: "#00FF88",
          lineWidth: 1,
          radius: 3,
        });
      }
    }
  }, [canvasRef, videoRef]);

  useEffect(() => {
    if (!ready || !videoRef.current) return;
    let cancelled = false;

    (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      if (cancelled || !videoRef.current) return;

      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      const cam = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await hands.send({ image: videoRef.current });
        },
        width: 854,
        height: 480,
      });
      cam.start();
      cameraRef.current = cam;
    })();

    return () => {
      cancelled = true;
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, [ready, videoRef, onResults]);

  return { isHandVisible };
}
