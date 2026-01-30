import { useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Send,
  Image,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  CheckCheck,
} from "lucide-react";
import { useChat, useSendMessage } from "@/hooks/use-chats";
import { useWidgetChat, useWidgetSendMessage } from "@/hooks/use-widget-chats";
import { socket } from "@/lib/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  fromMe: boolean | null;
  senderName?: string | null;
  timestamp?: string | null;
  type: string | null;
  chatId?: number;
  isSaving?: boolean;
  isSaveFailed?: boolean;
}

interface LocalMessage {
  id: string | number;
  content: string;
  fromMe: boolean;
  senderName?: string;
  timestamp: string;
  type: string;
  isQueued?: boolean; // Mark messages that are queued for sending
  isSaving?: boolean;
  isSaveFailed?: boolean;
}

type DisplayMessage = Message | LocalMessage;

interface ChatWindowProps {
  chatId: number;
  isWidget?: boolean;
  publicKey?: string;
  themeColor?: string;
}

export function ChatWindow({
  chatId,
  isWidget,
  publicKey,
  themeColor,
}: ChatWindowProps) {
  const { data: chat, isLoading } =
    isWidget && publicKey ? useWidgetChat(publicKey, chatId) : useChat(chatId);
  const { mutate: sendMessage, isPending: isSending } =
    isWidget && publicKey ? useWidgetSendMessage(publicKey) : useSendMessage();
  const [input, setInput] = useState("");
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset messages when switching chats
  useEffect(() => {
    setDisplayMessages([]);
  }, [chatId]);

  // Initialize and update messages from database on load
  useEffect(() => {
    if (chat?.messages) {
      setDisplayMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = chat.messages
          .filter((msg) => !existingIds.has(msg.id))
          .map((msg) => ({
            ...msg,
            chatId: chatId,
            timestamp:
              msg.timestamp instanceof Date
                ? msg.timestamp.toISOString()
                : msg.timestamp || null,
          }));

        // Only update if there are actually new messages
        if (newMessages.length > 0) {
          console.log(
            "📨 [CLIENT] Adding new messages from API:",
            newMessages.length,
          );
          return [...prev, ...newMessages];
        }
        return prev;
      });
    }
  }, [chat?.messages, chatId]);

  // Handle real-time incoming messages
  useEffect(() => {
    const handleNewMessage = (message: any) => {
      console.log("📨 [CLIENT] Received message via WebSocket:", {
        id: message.id,
        chatId: message.chatId,
        content: message.content,
        fromMe: message.fromMe,
        senderName: message.senderName,
        timestamp: message.timestamp,
      });

      if (message.chatId === chatId) {
        setDisplayMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some((m) => m.id === message.id);
          if (!exists) {
            return [
              ...prev,
              {
                ...message,
                chatId: chatId,
                timestamp: message.timestamp
                  ? typeof message.timestamp === "number"
                    ? new Date(message.timestamp * 1000).toISOString()
                    : typeof message.timestamp === "string"
                      ? message.timestamp
                      : new Date(message.timestamp).toISOString()
                  : new Date().toISOString(),
              },
            ];
          }
          return prev;
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  // Handle message saved in background (DB persistence confirmed)
  useEffect(() => {
    const handleMessageSaved = (data: { tempId: string; id: number }) => {
      console.log(
        `✅ [CLIENT] Message saved to DB: tempId=${data.tempId} -> id=${data.id}`,
      );
      setDisplayMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.tempId
            ? { ...msg, id: data.id, isSaving: false, isQueued: false }
            : msg,
        ),
      );
    };

    const handleMessageSaveError = (data: {
      tempId: string;
      error: string;
    }) => {
      console.error(`❌ [CLIENT] Failed to save message:`, data);
      setDisplayMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.tempId
            ? { ...msg, isSaving: false, isSaveFailed: true }
            : msg,
        ),
      );
    };

    socket.on("message_saved", handleMessageSaved);
    socket.on("message_save_error", handleMessageSaveError);

    return () => {
      socket.off("message_saved", handleMessageSaved);
      socket.off("message_save_error", handleMessageSaveError);
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const messageContent = input.trim();
    const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const optimisticMessage: LocalMessage = {
      id: tempMessageId,
      content: messageContent,
      fromMe: true,
      senderName: isWidget ? "You" : "Agent",
      timestamp: new Date().toISOString(),
      type: "text",
      isQueued: true,
      isSaving: true,
    };

    console.log("⚡ [CLIENT] INSTANT: Adding message to UI:", {
      id: optimisticMessage.id,
      content: messageContent,
      isWidget,
    });
    setDisplayMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    if (isWidget && publicKey) {
      requestAnimationFrame(() => {
        console.log(
          "📤 [CLIENT] BACKGROUND: Sending widget message via WebSocket",
        );
        socket.emit("send_message", {
          chatId,
          content: messageContent,
          publicKey,
          tempId: tempMessageId, // Pass the same tempId to prevent duplication
        });
      });
    } else {
      requestAnimationFrame(() => {
        console.log("📤 [CLIENT] BACKGROUND: Sending agent message via API");
        sendMessage({ chatId, content: messageContent });
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efe7dd] relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-40 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
        }}
      />

      {/* Header */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border p-4 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${chat.customerName}`}
            />
            <AvatarFallback>
              {chat.customerName?.substring(0, 2).toUpperCase() || "CN"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">
              {chat.customerName || chat.remoteJid}
            </h3>
            <p className="text-xs text-muted-foreground">
              {chat.status === "open" ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Active now
                </span>
              ) : (
                "Archived chat"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 scroll-smooth"
      >
        <div className="flex justify-center my-4">
          <span className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-white/20">
            {format(new Date(chat.createdAt || Date.now()), "MMMM d, yyyy")}
          </span>
        </div>

        {displayMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[70%]",
              msg.fromMe ? "self-end items-end" : "self-start items-start",
            )}
          >
            <div
              className={cn(
                "p-3 rounded-lg shadow-sm text-sm relative group",
                msg.fromMe
                  ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none"
                  : "bg-white text-gray-900 rounded-tl-none",
              )}
            >
              {msg.type === "image" ? (
                <div className="space-y-2">
                  <img
                    src={msg.content}
                    alt="Media message"
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(msg.content, "_blank")}
                  />
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              <div
                className={cn(
                  "text-[10px] text-gray-500 mt-1 flex items-center justify-end gap-1",
                  msg.fromMe ? "text-gray-500" : "text-gray-400",
                )}
              >
                {msg.timestamp ? format(new Date(msg.timestamp), "h:mm a") : ""}
                {msg.fromMe && (
                  <>
                    {msg.isSaving ? (
                      <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : msg.isSaveFailed ? (
                      <span className="text-red-500 font-bold">!</span>
                    ) : (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sender name for group contexts or clarity */}
            {!msg.fromMe && msg.senderName && (
              <span className="text-[10px] text-gray-500 mt-1 ml-1 font-medium">
                {msg.senderName}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-card/95 backdrop-blur-md p-3 border-t border-border relative z-10">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 max-w-4xl mx-auto"
        >
          <div className="flex gap-1 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-9 w-9"
            >
              <Smile className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-9 w-9"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 bg-muted/30 rounded-2xl border border-transparent focus-within:border-primary/20 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="border-0 bg-transparent focus-visible:ring-0 min-h-[44px] py-3"
            />
          </div>

          <Button
            type="submit"
            disabled={!input.trim()}
            size="icon"
            className={cn(
              "h-11 w-11 rounded-full shrink-0 transition-all duration-300 shadow-md",
              input.trim()
                ? "bg-primary hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-muted",
            )}
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
