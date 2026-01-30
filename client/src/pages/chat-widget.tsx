import { useState, useEffect } from "react";
import { useParams } from "wouter";
import {
  useWidgetChats,
  useWidgetChat,
  useWidgetSendMessage,
} from "@/hooks/use-widget-chats";
import { useWidgetConfig } from "@/hooks/use-widget";
import { ChatWindow } from "@/components/ChatWindow";
import { socket } from "@/lib/socket";
import { queryClient } from "@/lib/queryClient";
import { Search, MessageCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ChatWidgetPage() {
  const { publicKey } = useParams();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: widgetConfig } = useWidgetConfig(publicKey || "");
  const { data: chats, isLoading } = useWidgetChats(publicKey || "");
  const { data: selectedChat } = useWidgetChat(publicKey || "", selectedChatId);

  // Socket connection for real-time updates
  useEffect(() => {
    if (publicKey) {
      console.log(`🔌 Widget joining tenant room via publicKey: ${publicKey}`);
      socket.emit("join_room", { publicKey });
    }
  }, [publicKey]);

  // Socket event listeners for real-time message updates
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      console.log("🔥 Widget received new message:", message);
      if (message.chatId) {
        // Invalidate widget chat queries
        queryClient.invalidateQueries({
          queryKey: ["/api/widget/chats", publicKey],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/widget/chats", publicKey, message.chatId],
        });
      }
    };

    const handleChatUpdate = (chat: any) => {
      console.log("🔥 Widget received chat update:", chat);
      queryClient.invalidateQueries({
        queryKey: ["/api/widget/chats", publicKey],
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("chat_update", handleChatUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("chat_update", handleChatUpdate);
    };
  }, [publicKey]);

  if (!publicKey) {
    return <div className="p-4 text-destructive">Invalid link</div>;
  }

  const filteredChats = chats?.filter(
    (chat) =>
      (chat.customerName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) || chat.remoteJid.includes(searchTerm),
  );

  const themeColor = widgetConfig?.config?.themeColor || "#25D366";

  return (
    <div
      className="flex h-screen bg-[#efe7dd]"
      style={{
        backgroundImage:
          'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
      }}
    >
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-lg">
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl font-bold font-display"
              style={{ color: themeColor }}
            >
              {widgetConfig?.name || "krs WhatsApp Widget"}
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              className="pl-9 bg-gray-100 border-transparent focus:bg-white transition-all rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading chats...
            </div>
          ) : filteredChats?.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
              <p>No chats found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredChats?.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left group relative",
                    selectedChatId === chat.id &&
                      "bg-green-50 hover:bg-green-100",
                  )}
                >
                  {selectedChatId === chat.id && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: themeColor }}
                    />
                  )}
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-semibold border border-gray-200">
                      {chat.customerName?.substring(0, 2) || "C"}
                    </div>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "font-semibold text-sm truncate",
                          selectedChatId === chat.id
                            ? "text-gray-900"
                            : "text-gray-700",
                        )}
                      >
                        {chat.customerName || chat.remoteJid}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {chat.lastMessageAt
                            ? format(new Date(chat.lastMessageAt), "h:mm a")
                            : ""}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate group-hover:text-gray-700 transition-colors">
                      Click to view messages...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div
        className="flex-1 flex flex-col bg-[#efe7dd] h-full"
        style={{
          backgroundImage:
            'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
        }}
      >
        {selectedChatId && selectedChat ? (
          <ChatWindow
            chatId={selectedChatId}
            isWidget={true}
            publicKey={publicKey}
            themeColor={themeColor}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <div className="bg-white p-6 rounded-full shadow-lg mb-6">
              <MessageCircle className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              KRS WhatsApp Widget
            </h2>
            <p className="max-w-md text-center mb-8">
              Select a chat from the sidebar to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
