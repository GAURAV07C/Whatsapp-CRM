import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

console.log("🚀 Starting WhatsApp client...");

const client = new Client({
  authStrategy: new LocalAuth(), // Local session storage
  puppeteer: { headless: false }, // open browser
});

// 1️⃣ QR Code event
client.on("qr", (qr) => {
  console.log("📸 Scan this QR with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// 2️⃣ Authenticated event
client.on("authenticated", () => {
  console.log("🔐 WhatsApp authenticated successfully!");
});

// 3️⃣ Ready event
client.on("ready", () => {
  console.log("✅ WhatsApp client is READY to receive messages!");
});

// 4️⃣ Message event (always attach immediately)
client.on("message", async (msg) => {
  console.log("🔥 MESSAGE RECEIVED!");
  console.log("From:", msg.from);
  console.log("Body:", msg.body);
});

// Initialize client
client.initialize().catch((err) => {
  console.error("❌ Failed to initialize WhatsApp client:", err);
});
