import { useEffect, useState } from "react";

interface VoicesResponse {
  speakers: { id: string; gender: string; label: string; sample_url: string | null }[];
  default_speaker: string;
  default_gender: string;
}

export function useVoices() {
  const [voices, setVoices] = useState<{ id: string; gender: string }[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/voices");
        const data: VoicesResponse = await res.json();
        setVoices(data.speakers || []);
        setSelectedVoice(data.default_speaker || "");
      } catch {
        // TTS backend not available
        setVoices([]);
        setSelectedVoice("");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { voices, selectedVoice, setSelectedVoice, loading };
}
