import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

export async function translateSignLanguage(videoBlob: Blob): Promise<string> {
  if (!apiKey) throw new Error("Sign Recognition api not set");

  const base64 = await blobToBase64(videoBlob);
  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64.split(",")[1],
              mimeType: "video/webm",
            },
          },
          {
            text: "You are expert ASL translator who learned sign language from lifeprint.com website. Translate it into a single meaningful English sentence with proper punctuation (!, ?, .) to match the emotion. Return ONLY the translated text, nothing else. If you cannot detect any sign language or the video is unclear, respond with `Unable to detect sign language in the video`.",
          },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      // @ts-ignore - videoMetadata and mediaResolution
      videoMetadata: { fps: 3.0 },
      // @ts-ignore
      mediaResolution: "MEDIA_RESOLUTION_LOW" as any,
    },
  });
  console.log("Gemini response:", response);
  return response.text ?? "";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
