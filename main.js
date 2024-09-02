import Groq from "groq-sdk";

const groq = new Groq({
  dangerouslyAllowBrowser: true,
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

const API_BASE_URL = "https://api.sws.speechify.com";
const API_KEY = import.meta.env.VITE_SPEECHIFY_API_KEY;
const VOICE_ID = "george";

async function getGroqChatCompletion(userQuestion) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Hello, How can I help you today?",
      },
    ],
    model: "llama3-8b-8192",
  });

  let response = chatCompletion.choices[0]?.message?.content || "";

  if (response.length > 200) {
    response = response.substring();
  }
  return response;
}

async function getAudio(text) {
  const res = await fetch(`${API_BASE_URL}/v1/audio/speech`, {
    method: "POST",
    body: JSON.stringify({
      input: `<speak>${text}</speak>`,
      voice_id: VOICE_ID,
      audio_format: "mp3",
    }),
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "content-type": "application/json",
    },
  });
}

if (!res.ok) {
  throw new Error(`${res.status} ${res.statusText}\n${await res.text()}`);
}

const responseData = await res.json();

const decodedAudioData = Uint8Array.from(atob(responseData.audio_data), (c) =>
  c.charCodeAt(0)
);

return new Blob([decodedAudioData], { type: "audio/mp3" });
