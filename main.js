import Groq from "groq-sdk";

const groq = new Groq({
  dangerouslyAllowBrowser: true,
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

// due to no tokens left I have to change the app to Web Speech API SpeechRecognition

async function handleQuestion(event) {
  event.preventDefault();
  isStopped = false;

  const question = document.getElementById("question").value;
  const chatHistory = document.getElementById("chatHistory");

  const userMessageElement = document.createElement("div");
  userMessageElement.classList.add("message user");
  userMessageElement.innerHTML = `<div class="message-content">${question}</div>`;
  chatHistory.appendChild(userMessageElement);

  const aiMessageElement = document.createElement("div");
  aiMessageElement.className = "message ai";
  aiMessageElement.innerHTML = `<div class="message-content><div class="typing-indicator"></div></div>`;
  chatHistory.appendChild(aiMessageElement);

  const messageContent = aiMessageElement.querySelector(".message-content");
  const typingIndicator = messageContent.querySelector(".typing-indicator");

  try {
    typingIndicator.style.visibility = "visible";
    document.getElementById("question").value = "";
    const response = await getGroqChatCompletion(question);

    let responseText = "";
    for (let i = 0; i < response.length; i++) {
      if (isStopped) {
        responseText += "(stopped)";
        break;
      }
      responseText += response[i];
      messageContent.innerHTML = formatResponse(responseText);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      await new Promise((resolve) => setTimeout(resolve, 25));
      typingIndicator.style.visibility = "hidden";
    }
  } catch (error) {}
}

let isStopped = false;
let selectedVoice = null;
let synth = window.speechSynthesis;

let utterance = null;
let isSpeaking = false;

function populateVoiceOptions() {
  const voiceSelect = document.getElementById("voiceSelect");
  const voices = window.speechSynthesis.getVoices();

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.textContent = voice.name;
    option.textContent = `${voice.name} - ${voice.lang}`;
    voiceSelect.appendChild(option);
  });
}
window.speechSynthesis.onvoiceschanged = populateVoiceOptions;

voiceSelect.onchange = function () {
  selectedVoice = voices.find((voice) => voice.name === voiceSelect.value);
};
document.getElementById("chatForm").addEventListener("submit", handleQuestion);
document.getElementById("stopButton").addEventListener("click", stopResponse);
