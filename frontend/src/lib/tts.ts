export async function speak(text: string, voiceId: string): Promise<void> {
  const res = await fetch("http://localhost:8000/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: voiceId }),
  });
  if (!res.ok) throw new Error("TTS failed");
  const audioBlob = await res.blob();
  const url = URL.createObjectURL(audioBlob);
  const audio = new Audio(url);
  await audio.play();
  audio.onended = () => URL.revokeObjectURL(url);
}
