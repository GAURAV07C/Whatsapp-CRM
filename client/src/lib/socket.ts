import { io } from "socket.io-client";
import { queryClient } from "./queryClient";

// Initialize socket
export const socket = io();

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

// Socket event listeners
// socket.on("new_message", (message) => {
//   console.log("New message received:", message);
//   // Invalidate chats query to refetch
//   queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
//   // Also invalidate specific chat query if we have the chatId
//   if (message.chatId) {
//     queryClient.invalidateQueries({ queryKey: ["/api/chats", message.chatId] });
//   }
// });

// ==========================

//===============

socket.on("new_message", (message) => {
  console.log("🔥 DEBUG: new_message event received on frontend!");
  console.log("🔥 New message received from socket:", message);

  // Check type of chatId
  if (message.chatId) {
    console.log(
      "💡 chatId type and value:",
      message.chatId,
      typeof message.chatId,
    );

    // Log current React Query cache keys
    const cacheKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey);
    console.log("📦 Current cache keys:", cacheKeys);

    // Invalidate general chats query
    console.log("🔄 Invalidating /api/chats query");
    queryClient.invalidateQueries({ queryKey: ["/api/chats"] });

    // Invalidate specific chat query
    console.log(`🔄 Invalidating /api/chats/${message.chatId} query`);
    queryClient.invalidateQueries({
      queryKey: ["/api/chats", message.chatId],
    });
  } else {
    console.warn("⚠️ message.chatId not found in payload", message);
  }
});

// socket.on("new_message", (msg) => {
//   console.log("🔥 SOCKET RECEIVED:", msg);
// });


socket.on("chat_update", (chat) => {
  console.log("Chat update received:", chat);
  // Invalidate chats query to refetch
  queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
  // Also invalidate specific chat query
  queryClient.invalidateQueries({ queryKey: ["/api/chats", chat.id] });
});

socket.on("status_change", (data) => {
  console.log("Status change received:", data);
  // Invalidate WhatsApp status query
  queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
});
