import { useChatSocket } from "@/hooks/chat-socket";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chats";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

function ChatWindow({ chatId }: { chatId: number }) {
  const { user } = useAuth();
  const { data: chat } = useChat(chatId);

  // Socket listener for this chat
  useChatSocket(chatId, user?.tenantId ?? null);

  return (
    <div>
      <h2>Chat #{chatId}</h2>
      {chat?.messages.map((msg: { id: Key | null | undefined; fromMe: any; senderName: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; content: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }) => (
        <div key={msg.id}>
          <strong>{msg.fromMe ? "Me" : msg.senderName}:</strong> {msg.content}
        </div>
      ))}
    </div>
  );
}
