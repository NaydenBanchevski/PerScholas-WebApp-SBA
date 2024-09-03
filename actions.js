import Groq from "groq-sdk";
import { formatResponse } from "./lib.js";

const groq = new Groq({
  dangerouslyAllowBrowser: true,
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

let isStopped = false;
let isSpeaking = false;
let selectedVoice = null;
let synth = window.speechSynthesis;
let utterance = null;
let activeToggleButton = null;
let responseInProgress = false; // if response is being generated

async function getGroqChatCompletion(
  userQuestion,
  model = "llama3-8b-8192",
  maxResponseLength = 6000
) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: userQuestion }],
      model,
    });

    let response = chatCompletion.choices[0]?.message?.content || "";

    if (response.length > maxResponseLength) {
      response = response.substring(0, maxResponseLength) + "...";
    }

    return response;
  } catch (error) {
    console.error("Error fetching chat completion:", error);
    throw new Error("Failed to fetch chat completion.");
  }
}

export async function handleQuestion(event) {
  event.preventDefault();

  // If a response is already in progress, do not proceed
  if (responseInProgress) {
    alert(
      "A response is already being generated. Please wait until it finishes or stop it."
    );
    return;
  }

  isStopped = false;
  responseInProgress = true;

  const questionInput = document.getElementById("question");
  const question = questionInput.value.trim();
  const chatHistory = document.getElementById("chatHistory");

  let userIsScrollingUp = false;

  const checkScrollPosition = () => {
    const scrollPosition =
      chatHistory.scrollHeight -
      chatHistory.clientHeight -
      chatHistory.scrollTop;
    userIsScrollingUp = scrollPosition > 50;
  };

  chatHistory.addEventListener("scroll", checkScrollPosition);

  const scrollToBottom = () => {
    if (!userIsScrollingUp) {
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  };

  if (question !== "") {
    const userMessageElement = document.createElement("div");
    userMessageElement.className = "message user";
    userMessageElement.innerHTML = `<div class="message-content">${question}</div>`;
    chatHistory.appendChild(userMessageElement);

    const aiMessageElement = document.createElement("div");
    aiMessageElement.className = "message ai";
    aiMessageElement.innerHTML = `<div class="message-content"><div class="typing-indicator"></div></div>`;
    chatHistory.appendChild(aiMessageElement);

    const messageContent = aiMessageElement.querySelector(".message-content");
    const typingIndicator = aiMessageElement.querySelector(".typing-indicator");

    scrollToBottom();

    try {
      typingIndicator.style.visibility = "visible";
      questionInput.value = "";
      const response = await getGroqChatCompletion(question);

      let responseText = "";
      for (let i = 0; i < response.length; i++) {
        if (isStopped) {
          responseText += " (stopped)";
          break;
        }
        responseText += response[i];
        messageContent.innerHTML = formatResponse(responseText);

        scrollToBottom();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      typingIndicator.style.visibility = "hidden";

      const toggleButton = document.createElement("button");
      toggleButton.className = "toggle-button";
      toggleButton.innerHTML = `<span class="material-symbols-outlined">
      text_to_speech
      </span>`;
      toggleButton.onclick = () => toggleAudio(responseText, toggleButton);
      chatHistory.appendChild(toggleButton);
    } catch (error) {
      chatHistory.textContent = "Error: " + error.message;
    } finally {
      responseInProgress = false;
    }
  } else {
    try {
      const response = await getGroqChatCompletion("");
      const aiMessageElement = document.createElement("div");
      aiMessageElement.className = "message ai";
      aiMessageElement.innerHTML = `<div class="message-content"><div class="typing-indicator"></div></div>`;
      chatHistory.appendChild(aiMessageElement);

      const messageContent = aiMessageElement.querySelector(".message-content");
      const typingIndicator =
        aiMessageElement.querySelector(".typing-indicator");

      scrollToBottom();

      typingIndicator.style.visibility = "visible";
      questionInput.value = "";

      let responseText = "";
      for (let i = 0; i < response.length; i++) {
        if (isStopped) {
          responseText += " (stopped)";
          break;
        }
        responseText += response[i];
        messageContent.innerHTML = formatResponse(responseText);

        scrollToBottom();
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      typingIndicator.style.visibility = "hidden";

      const toggleButton = document.createElement("button");
      toggleButton.className = "toggle-button";
      toggleButton.innerHTML = `<span class="material-symbols-outlined">
      text_to_speech
      </span>`;
      toggleButton.onclick = () => toggleAudio(responseText, toggleButton);
      aiMessageElement.appendChild(toggleButton);
    } catch (error) {
      console.error("Error fetching auto message:", error);
    } finally {
      responseInProgress = false;
    }
  }

  chatHistory.removeEventListener("scroll", checkScrollPosition);
}

export function stopResponse() {
  isStopped = true;
  responseInProgress = false;
}

export function toggleAudio(text, button) {
  if (activeToggleButton && activeToggleButton !== button) {
    synth.cancel();
    activeToggleButton.innerHTML = `<span class="material-symbols-outlined">
    text_to_speech
    </span>`;
    isSpeaking = false;
  }

  if (isSpeaking && activeToggleButton === button) {
    synth.cancel();
    isSpeaking = false;
    button.innerHTML = `<span class="material-symbols-outlined">
    text_to_speech
    </span>`;
  } else {
    speakText(text);
    isSpeaking = true;
    button.innerHTML = `<span class="material-symbols-outlined">
    stop
    </span>`;
  }

  activeToggleButton = button;
}

function speakText(text) {
  if (utterance) {
    synth.cancel();
  }

  utterance = new SpeechSynthesisUtterance(text);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.pitch = 1.2;
  utterance.rate = 1.1;

  utterance.onend = () => {
    isSpeaking = false;
    const toggleButton = activeToggleButton;
    if (toggleButton) {
      toggleButton.innerHTML = `<span class="material-symbols-outlined">
      text_to_speech
      </span>`;
    }
    activeToggleButton = null;
  };

  synth.speak(utterance);
}

export function populateVoiceOptions() {
  const voiceSelect = document.getElementById("voiceSelect");
  const voices = window.speechSynthesis.getVoices();

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  voiceSelect.onchange = () => {
    selectedVoice = voices.find((voice) => voice.name === voiceSelect.value);
  };
}
