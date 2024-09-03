import Groq from "groq-sdk";

const groq = new Groq({
  dangerouslyAllowBrowser: true,
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

// due to no tokens left I have to change the app to Web Speech API SpeechRecognition

let isStopped = false;
let selectedVoice = null;
let synth = window.speechSynthesis;
let utterance = null;
let isSpeaking = false;

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

async function handleQuestion(event) {
  event.preventDefault();
  isStopped = false;

  const question = document.getElementById("question").value;
  const chatHistory = document.getElementById("chatHistory");

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

  chatHistory.scrollTop = chatHistory.scrollHeight;

  try {
    typingIndicator.style.visibility = "visible";
    document.getElementById("question").value = "";
    const response = await getGroqChatCompletion(question);

    let responseText = "";
    for (let i = 0; i < response.length; i++) {
      if (isStopped) {
        responseText += " (stopped)";
        break;
      }
      responseText += response[i];
      messageContent.innerHTML = formatResponse(responseText);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    typingIndicator.style.visibility = "hidden";

    const toggleButton = document.createElement("button");
    toggleButton.innerHTML = `<span class="material-symbols-outlined">
text_to_speech
</span>`;
    toggleButton.className = "toggle-button";
    toggleButton.onclick = () => toggleAudio(responseText, toggleButton);

    aiMessageElement.appendChild(toggleButton);
  } catch (error) {
    messageContent.textContent = "Error: " + error.message;
  }
}

function toggleAudio(text, button) {
  if (isSpeaking) {
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
}

function speakText(text) {
  if (utterance) {
    synth.cancel();
  }

  utterance = new SpeechSynthesisUtterance(text);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  utterance.pitch = 1;
  utterance.rate = 1;

  utterance.onend = () => {
    isSpeaking = false;
    const toggleButton = document.querySelector(".toggle-button");
    if (toggleButton) {
      toggleButton.innerHTML = `<span class="material-symbols-outlined">
text_to_speech
</span>`;
    }
  };

  synth.speak(utterance);
}

function stopResponse() {
  isStopped = true;
}

function populateVoiceOptions() {
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

// Function to format the response text
function formatResponse(text) {
  // Define categories for keywords
  const highImportanceKeywords = [
    "class",
    "function",
    "return",
    "await",
    "async",
    "if",
    "for",
    "while",
    "switch",
    "case",
    "break",
    "continue",
    "throw",
    "try",
    "catch",
  ];
  const mediumImportanceKeywords = [
    "const",
    "let",
    "var",
    "new",
    "extends",
    "super",
    "this",
    "instanceof",
    "import",
    "export",
    "debugger",
    "default",
  ];
  const lowImportanceKeywords = [
    "do",
    "else",
    "finally",
    "in",
    "of",
    "yield",
    "typeof",
    "void",
    "with",
  ];

  // Create regex patterns for each category
  const highImportancePattern = new RegExp(
    `\\b(${highImportanceKeywords.join("|")})\\b`,
    "g"
  );
  const mediumImportancePattern = new RegExp(
    `\\b(${mediumImportanceKeywords.join("|")})\\b`,
    "g"
  );
  const lowImportancePattern = new RegExp(
    `\\b(${lowImportanceKeywords.join("|")})\\b`,
    "g"
  );

  // Function to highlight keywords based on importance
  function highlightCode(code) {
    code = code.replace(
      highImportancePattern,
      '<span class="keyword high-importance">$1</span>'
    );
    code = code.replace(
      mediumImportancePattern,
      '<span class="keyword medium-importance">$1</span>'
    );
    code = code.replace(
      lowImportancePattern,
      '<span class="keyword low-importance">$1</span>'
    );
    return code;
  }

  // Replace code blocks (e.g., ```code```)
  text = text.replace(/```([\s\S]*?)```/g, function (match, code) {
    return (
      "<pre><code>" +
      highlightCode(code.replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
      "</code></pre>"
    );
  });

  // Replace inline code (e.g., "`code`")
  text = text.replace(/`([^`]+)`/g, function (match, code) {
    return (
      "<code>" +
      highlightCode(code.replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
      "</code>"
    );
  });

  // Replace bullet points (e.g., "- Item")
  text = text.replace(/^\s*-\s/gm, "<br>&nbsp;&nbsp;&nbsp;&nbsp;&bull; ");

  // Replace numbered headings (e.g., "1. **Heading**")
  text = text.replace(/^(\d+)\.\s\*\*(.*?)\*\*/gm, "<strong>$1. $2</strong>");

  // Replace subheadings (e.g., "## Subheading")
  text = text.replace(/^##\s(.*?)/gm, "<strong><u>$1</u></strong>");

  // Replace sub-subheadings (e.g., "### Sub-subheading")
  text = text.replace(/^###\s(.*?)/gm, "<strong><em>$1</em></strong>");

  // Replace bold text (e.g., "**bold**")
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace italic text (e.g., "*italic*")
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Replace hyperlinks (e.g., "[text](url)")
  text = text.replace(
    /$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$([^)]+)$end:math:text$/g,
    '<a href="$2" target="_blank">$1</a>'
  );

  // Replace blockquotes (e.g., "> quote")
  text = text.replace(/^>\s(.*?)/gm, "<blockquote>$1</blockquote>");

  // Replace horizontal lines (e.g., "---")
  text = text.replace(/^\s*---\s*$/gm, "<hr>");

  // Replace new lines with <br>, except inside <pre><code>
  text = text.replace(/(?<!<\/pre>)\n/g, "<br>");

  return text;
}

window.speechSynthesis.onvoiceschanged = populateVoiceOptions;

document.getElementById("chatForm").addEventListener("submit", handleQuestion);
document.getElementById("stopButton").addEventListener("click", stopResponse);
