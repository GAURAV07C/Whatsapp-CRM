import { WhatsAppManager } from "./whatsapp";

async function testMessage(agentId: number) {
  const client = await WhatsAppManager.getClient(agentId);
  console.log(`🚀 WhatsApp client initialized for agent ${agentId}`);

  // Direct message listener
  client.on("message", async (msg) => {
    console.log("🔥 [TEST] New message received:");
    console.log({
      from: msg.from,
      body: msg.body,
      type: msg.type,
      fromMe: msg.fromMe,
      timestamp: msg.timestamp,
    });

    // Optional: just reply back for testing
    if (!msg.fromMe) {
      await msg.reply("Message received ✅");
    }
  });
}

// Replace with your agent ID
testMessage(3).catch(console.error);
