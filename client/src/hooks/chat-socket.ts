import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useChatSocket(
  currentChatId: number | null,
  tenantId: number | null,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentChatId || !tenantId) return;

    // Join socket room for this chat
    console.log(`🔑 Joining socket room for chat_${currentChatId}`);
    socket.emit("join_room", { chatId: currentChatId, tenantId });

    // Listen for incoming messages - only update if message is for this chat
    const handleNewMessage = (msg: any) => {
      console.log("🔥 SOCKET new_message received:", {
        id: msg.id,
        chatId: msg.chatId,
        currentChatId,
        content: msg.content,
      });

      // Only invalidate if message is for this chat
      if (msg.chatId === currentChatId) {
        console.log(
          `📨 Message is for current chat ${currentChatId}, updating...`,
        );
        // Invalidate specific chat query
        queryClient.invalidateQueries({
          queryKey: [api.chats.get.path, currentChatId],
        });
        // Invalidate chat list for unread counts
        queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
      } else {
        console.log(
          `⏭️  Message ${msg.id} is for chat ${msg.chatId}, not for current chat ${currentChatId}, skipping`,
        );
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [currentChatId, tenantId, queryClient]);
}
