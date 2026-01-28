// Embedded WhatsApp Widget Script
(function () {
  const config = window.waWidgetConfig || {};
  const publicKey =
    config.publicKey || document.currentScript.getAttribute("data-key");

  if (!publicKey) {
    console.error("WhatsApp Widget: No public key provided.");
    return;
  }

  const BASE_URL = window.location.origin; // In production, this would be your SaaS domain

  // Create Container
  const container = document.createElement("div");
  container.id = "wa-widget-container";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "9999";
  container.style.fontFamily = "sans-serif";
  document.body.appendChild(container);

  // Create Toggle Button (Chat Bubble)
  const button = document.createElement("div");
  button.style.width = "60px";
  button.style.height = "60px";
  button.style.borderRadius = "50%";
  button.style.backgroundColor = "#25D366";
  button.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.transition = "transform 0.2s";
  button.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.71 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16Z" />
    </svg>
  `;
  container.appendChild(button);

  // Create Chat Window (Hidden by default)
  const chatWindow = document.createElement("div");
  chatWindow.style.position = "absolute";
  chatWindow.style.bottom = "80px";
  chatWindow.style.right = "0";
  chatWindow.style.width = "350px";
  chatWindow.style.height = "500px";
  chatWindow.style.backgroundColor = "white";
  chatWindow.style.borderRadius = "12px";
  chatWindow.style.boxShadow = "0 5px 20px rgba(0,0,0,0.15)";
  chatWindow.style.display = "none";
  chatWindow.style.overflow = "hidden";
  chatWindow.style.flexDirection = "column";
  chatWindow.innerHTML = `
    <div style="background: #075E54; color: white; padding: 16px; border-radius: 12px 12px 0 0; display: flex; align-items: center;">
      <select id="wa-agent-select" style="flex: 1; background: #128C7E; color: white; border: none; border-radius: 4px; padding: 4px; font-size: 14px;">
        <option value="">Select Agent...</option>
      </select>
      <div id="wa-close-btn" style="cursor: pointer; margin-left: 8px;">✕</div>
    </div>
    <div id="wa-content" style="flex: 1; display: flex; flex-direction: column;">
      <div id="wa-qr-container" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #f5f5f5; padding: 16px; text-align: center;">
        <div>
          <p style="margin: 0 0 16px 0; color: #666;">Select an agent and scan the QR code to connect</p>
          <div id="wa-qr-display" style="display: none;"></div>
          <button id="wa-toggle-messages" style="background: #25D366; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-top: 16px; display: none;">View Messages</button>
        </div>
      </div>
      <div id="wa-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #ECE5DD; display: none; flex-direction: column; gap: 8px;">
        <div style="background: white; padding: 8px 12px; border-radius: 8px; align-self: flex-start; max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Connecting to support...
        </div>
      </div>
    </div>
    <div id="wa-input-container" style="padding: 10px; background: #f0f0f0; display: none; gap: 8px;">
      <input id="wa-input" type="text" placeholder="Type a message..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 20px; outline: none;">
      <button id="wa-send-btn" style="background: #075E54; color: white; border: none; padding: 8px 12px; border-radius: 50%; cursor: pointer;">➤</button>
    </div>
  `;
  container.appendChild(chatWindow);

  // Functionality
  let isOpen = false;
  let socket = null;
  let chatId = null;
  let selectedAgentId = null;
  let agents = [];

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? "flex" : "none";
    if (isOpen && !socket) {
      initSocket();
    }
  }

  button.addEventListener("click", toggleChat);
  chatWindow
    .querySelector("#wa-close-btn")
    .addEventListener("click", toggleChat);

  // Agent selection
  const agentSelect = document.getElementById("wa-agent-select");
  agentSelect.addEventListener("change", (e) => {
    selectedAgentId = e.target.value;
    if (selectedAgentId) {
      showQR();
      fetchQR();
    } else {
      showAgentSelection();
    }
  });

  // Toggle between QR and messages
  const toggleMessagesBtn = document.getElementById("wa-toggle-messages");
  toggleMessagesBtn.addEventListener("click", () => {
    const qrContainer = document.getElementById("wa-qr-container");
    const messages = document.getElementById("wa-messages");
    const inputContainer = document.getElementById("wa-input-container");

    if (messages.style.display === "none") {
      qrContainer.style.display = "none";
      messages.style.display = "flex";
      inputContainer.style.display = "flex";
      toggleMessagesBtn.textContent = "View QR";
    } else {
      qrContainer.style.display = "flex";
      messages.style.display = "none";
      inputContainer.style.display = "none";
      toggleMessagesBtn.textContent = "View Messages";
    }
  });

  function showAgentSelection() {
    document.getElementById("wa-qr-container").style.display = "flex";
    document.getElementById("wa-messages").style.display = "none";
    document.getElementById("wa-input-container").style.display = "none";
    document.getElementById("wa-qr-display").style.display = "none";
    document.getElementById("wa-toggle-messages").style.display = "none";
  }

  function showQR() {
    document.getElementById("wa-qr-container").style.display = "flex";
    document.getElementById("wa-messages").style.display = "none";
    document.getElementById("wa-input-container").style.display = "none";
    document.getElementById("wa-qr-display").style.display = "block";
    document.getElementById("wa-toggle-messages").style.display = "inline-block";
  }

  function fetchAgents() {
    fetch(`${BASE_URL}/api/widget/agents?publicKey=${publicKey}`)
      .then((res) => res.json())
      .then((data) => {
        agents = data;
        const select = document.getElementById("wa-agent-select");
        select.innerHTML = '<option value="">Select Agent...</option>';
        data.forEach((agent) => {
          const option = document.createElement("option");
          option.value = agent.id;
          option.textContent = agent.username;
          select.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("Failed to fetch agents", err);
      });
  }

  function fetchQR() {
    if (!selectedAgentId) return;

    fetch(`${BASE_URL}/api/widget/whatsapp/qr/${selectedAgentId}`)
      .then((res) => res.json())
      .then((data) => {
        const qrDisplay = document.getElementById("wa-qr-display");
        if (data.qr) {
          qrDisplay.innerHTML = `<img src="${data.qr}" style="max-width: 200px; max-height: 200px;" alt="QR Code">`;
        } else {
          qrDisplay.innerHTML = `<p>Status: ${data.status}</p>`;
        }
      })
      .catch((err) => {
        console.error("Failed to fetch QR", err);
      });
  }

  function appendMessage(text, isMe, senderInfo) {
    const msgs = document.getElementById("wa-messages");
    const div = document.createElement("div");
    div.style.padding = "8px 12px";
    div.style.borderRadius = "8px";
    div.style.maxWidth = "80%";
    div.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
    div.style.fontSize = "14px";
    div.style.alignSelf = isMe ? "flex-end" : "flex-start";
    div.style.backgroundColor = isMe ? "#DCF8C6" : "white";

    if (!isMe && senderInfo) {
      const senderDiv = document.createElement("div");
      senderDiv.style.fontSize = "12px";
      senderDiv.style.fontWeight = "bold";
      senderDiv.style.marginBottom = "4px";
      senderDiv.style.color = "#666";
      senderDiv.textContent = senderInfo;
      div.appendChild(senderDiv);
    }

    const textDiv = document.createElement("div");
    textDiv.innerText = text;
    div.appendChild(textDiv);

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function initSocket() {
    // Load Socket.IO script dynamically if not present
    if (typeof io === "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
      script.onload = connect;
      document.head.appendChild(script);
    } else {
      connect();
    }
  }

  function connect() {
    // Fetch config first
    fetch(`${BASE_URL}/api/widget/config?publicKey=${publicKey}`)
      .then((res) => res.json())
      .then((data) => {
        const msgs = document.getElementById("wa-messages");
        msgs.innerHTML = ""; // Clear loading
        appendMessage(data.config.greetingMessage || "Hello!", false);

        // Fetch agents for the dropdown
        fetchAgents();

        socket = io(BASE_URL, { path: "/socket.io" });

        socket.on("connect", () => {
          // Join room logic would go here
          // For now, we simulate
        });

        socket.on("new_message", (msg) => {
          appendMessage(msg.content, false, msg.senderName || msg.remoteJid);
        });

        // Send Message
        const input = document.getElementById("wa-input");
        const sendBtn = document.getElementById("wa-send-btn");

        const sendMessage = () => {
          const text = input.value.trim();
          if (!text) return;

          appendMessage(text, true);
          input.value = "";

          // In real implementation:
          // fetch(`${BASE_URL}/api/chats/${chatId}/messages`, { ... })
        };

        sendBtn.addEventListener("click", sendMessage);
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") sendMessage();
        });
      })
      .catch((err) => {
        console.error("Failed to load widget config", err);
      });
  }
})();
