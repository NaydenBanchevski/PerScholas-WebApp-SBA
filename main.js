import {
  handleQuestion,
  stopResponse,
  populateVoiceOptions,
} from "./actions.js";

document.getElementById("chatForm").addEventListener("submit", handleQuestion);

document.getElementById("stopButton").addEventListener("click", stopResponse);

document
  .getElementById("question")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleQuestion(event);
    }
  });

window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
