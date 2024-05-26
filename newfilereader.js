// ==UserScript==
// @name         ChatGPT-Question-Automation
// @namespace    http://tampermonkey.net/
// @version      0.17
// @description  Read a file and input its contents into an input field
// @author       You
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @match        https://new.oaifree.com/*
// @grant        none
// @license MIT
// @downloadURL  https://update.greasyfork.org/scripts/468298/ChatGPT-Question-Automation.user.js
// @updateURL    https://update.greasyfork.org/scripts/468298/ChatGPT-Question-Automation.meta.js
// ==/UserScript==

(function () {
  "use strict";

  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.top = "50px";
  panel.style.right = "0";
  panel.style.backgroundColor = "white";
  panel.style.padding = "10px";
  panel.style.border = "1px solid black";
  panel.style.width = "100px";
  panel.style.fontFamily = "'Arial', sans-serif";
  panel.style.backgroundColor = "#f2f2f2";
  panel.style.borderRadius = "10px";
  document.body.appendChild(panel);

  const hoverPanel = document.createElement("div");
  hoverPanel.style.position = "fixed";
  hoverPanel.style.top = "0";
  hoverPanel.style.right = "110px";
  hoverPanel.style.backgroundColor = "white";
  hoverPanel.style.padding = "10px";
  hoverPanel.style.border = "1px solid black";
  hoverPanel.style.width = "200px";
  hoverPanel.style.fontFamily = "'Arial', sans-serif";
  hoverPanel.style.opacity = "0";
  hoverPanel.style.backgroundColor = "#f2f2f2";
  hoverPanel.style.borderRadius = "10px";
  hoverPanel.style.transition = "opacity 0.3s ease";
  document.body.appendChild(hoverPanel);

  let timeoutId;
  const showHoverPanel = () => {
    clearTimeout(timeoutId);
    hoverPanel.style.opacity = "1";
    hoverPanel.style.pointerEvents = "auto";
  };

  const hideHoverPanel = () => {
    timeoutId = setTimeout(() => {
      hoverPanel.style.opacity = "0";
      hoverPanel.style.pointerEvents = "none";
    }, 200);
  };

  panel.addEventListener("mouseover", showHoverPanel);
  panel.addEventListener("mouseout", hideHoverPanel);
  hoverPanel.addEventListener("mouseover", showHoverPanel);
  hoverPanel.addEventListener("mouseout", hideHoverPanel);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.style.marginTop = "10px";
  fileInput.style.width = "100%";
  panel.appendChild(fileInput);

  const fileNameLabel = document.createElement("span");
  fileNameLabel.style.display = "block";
  fileNameLabel.style.marginTop = "10px";
  fileNameLabel.style.overflow = "hidden";
  fileNameLabel.style.textOverflow = "ellipsis";
  panel.appendChild(fileNameLabel);

  const promptLabel = document.createElement("span");
  promptLabel.textContent = "Prompt: ";
  promptLabel.style.display = "block";
  hoverPanel.appendChild(promptLabel);
  const promptInput = document.createElement("input");
  promptInput.type = "text";
  promptInput.style.marginTop = "10px";
  promptInput.style.width = "100%";
  hoverPanel.appendChild(promptInput);

  const restDiv = document.createElement("div");
  restDiv.style.display = "flex";
  restDiv.style.alignItems = "center";
  restDiv.style.justifyContent = "space-between";
  restDiv.style.width = "100%";
  hoverPanel.appendChild(restDiv);

  const restLabel = document.createElement("label");
  restLabel.textContent = "sleep after every 25 sends";
  restDiv.appendChild(restLabel);

  const restCheckbox = document.createElement("input");
  restCheckbox.type = "checkbox";
  restDiv.appendChild(restCheckbox);

  const delayInput = document.createElement("input");
  delayInput.type = "number";
  delayInput.style.marginTop = "10px";
  delayInput.style.width = "100%";
  delayInput.placeholder = "sleeptime(s)";
  hoverPanel.appendChild(delayInput);

  const confirmButton = document.createElement("button");
  confirmButton.textContent = "确认";
  confirmButton.style.marginTop = "10px";
  confirmButton.style.width = "100%";
  confirmButton.style.backgroundColor = "#4CAF50";
  confirmButton.style.color = "white";
  confirmButton.style.border = "none";
  confirmButton.style.cursor = "pointer";
  confirmButton.style.borderRadius = "5px";
  panel.appendChild(confirmButton);

  const stopButton = document.createElement("button");
  stopButton.textContent = "停止";
  stopButton.style.marginTop = "10px";
  stopButton.style.width = "100%";
  stopButton.style.backgroundColor = "#f44336";
  stopButton.style.color = "white";
  stopButton.style.border = "none";
  stopButton.style.cursor = "pointer";
  stopButton.style.borderRadius = "5px";
  panel.appendChild(stopButton);

  confirmButton.addEventListener("mouseover", function () {
    confirmButton.style.backgroundColor = "#45a049";
  });

  confirmButton.addEventListener("mouseout", function () {
    confirmButton.style.backgroundColor = "#4CAF50";
  });

  stopButton.addEventListener("mouseover", function () {
    stopButton.style.backgroundColor = "#e53935";
  });

  stopButton.addEventListener("mouseout", function () {
    stopButton.style.backgroundColor = "#f44336";
  });

  const progressBar = document.createElement("progress");
  progressBar.style.width = "100%";
  progressBar.style.marginTop = "10px";
  progressBar.max = 1;
  panel.appendChild(progressBar);

  const alertDiv = document.createElement("div");
  alertDiv.style.position = "fixed";
  alertDiv.style.top = "10px";
  alertDiv.style.right = "10px";
  alertDiv.style.padding = "10px";
  alertDiv.style.backgroundColor = "red";
  alertDiv.style.color = "white";
  alertDiv.style.display = "none";
  alertDiv.style.backgroundColor = "#f44336";
  alertDiv.style.color = "white";
  alertDiv.style.borderRadius = "5px";
  document.body.appendChild(alertDiv);

  function showAlert(message) {
    alertDiv.textContent = message;
    alertDiv.style.display = "block";
    setTimeout(function () {
      alertDiv.style.display = "none";
    }, 3000);
  }

  let shouldStop = false;

  stopButton.addEventListener("click", function () {
    shouldStop = true;
    showAlert("任务已停止");
  });

  confirmButton.addEventListener("click", function () {
    let fileContent;

    if (localStorage.getItem("savedFile")) {
      fileContent = localStorage.getItem("savedFile");
    } else {
      const file = fileInput.files[0];
      if (!file) {
        showAlert("请先选择文件");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        fileContent = e.target.result;
        handleFileContent(fileContent);
      };
      reader.readAsText(file);
      return;
    }

    handleFileContent(fileContent);
  });

  function handleFileContent(fileContent) {
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    if (Array.isArray(lines)) {
      let messagesSent = 0;
      let messageCount = 0;

      const prompt = promptInput.value || localStorage.getItem("prompt");
      localStorage.setItem("prompt", prompt);
      progressBar.max = lines.length;

      function sendMessage() {
        if (messageCount >= lines.length || shouldStop) {
          progressBar.value = lines.length;
          return;
        }

        const inputField = document.querySelector("#prompt-textarea");
        const sendButton = document.querySelector('[data-testid="fruitjuice-send-button"]');

        if (!inputField || !sendButton) {
          return;
        }

        if (sendButton.disabled) {
          const item = lines[messageCount++];
          inputField.value = (prompt && prompt !== "null" ? prompt : "") + item;

          var inputEvent = new Event("input", { bubbles: true });
          inputField.dispatchEvent(inputEvent);

          setTimeout(function () {
            sendButton.click();
          }, 1000);

          var sleep_time = 60000 || delayInput.value * 1000;
          messagesSent++;

          progressBar.value = messagesSent;

          if (restCheckbox.checked && messagesSent >= 25) {
            setTimeout(sendMessage, 3 * 60 * 60 * 1000 - 25 * sleep_time);
            messagesSent = 0;
          } else {
            setTimeout(sendMessage, sleep_time);
          }
        } else {
          setTimeout(sendMessage, 1000); // Retry after 1 second if button is not disabled
        }
      }

      sendMessage();
    }
  }

  fileInput.addEventListener("change", function () {
    if (this.files && this.files.length) {
      fileNameLabel.textContent = this.files[0].name;
      var reader = new FileReader();
      reader.onload = function (event) {
        localStorage.setItem("savedFile", event.target.result);
        localStorage.setItem("savedFileName", fileInput.files[0].name);
      };
      reader.readAsText(this.files[0]);
    }
  });

  window.addEventListener("load", function () {
    var savedFileName = localStorage.getItem("savedFileName");
    if (savedFileName) {
      fileNameLabel.textContent = savedFileName;
    }
    var prompt = localStorage.getItem("prompt");
    if (prompt) {
      promptInput.value = prompt;
    }
  });
})();
