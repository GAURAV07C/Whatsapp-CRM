import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useChatSocket(currentChatId: number | null, tenantId: number | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentChatId || !tenantId) return;

    // Join socket room for this chat
    console.log(`🔑 Joining socket room for chat_${currentChatId}`);
    socket.emit("join_room", { chatId: currentChatId, tenantId });

    // Listen for incoming messages
    const handleNewMessage = (msg: any) => {
      console.log("🔥 SOCKET new_message received:", msg);

      // Invalidate specific chat query
      queryClient.invalidateQueries({ queryKey: [api.chats.get.path, currentChatId] });

      // Invalidate chat list
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [currentChatId, tenantId, queryClient]);
}
