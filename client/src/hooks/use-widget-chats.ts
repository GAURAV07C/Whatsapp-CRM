import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Message queue for instant UI updates
class MessageQueue {
  private queue: Map<string, any[]> = new Map();
  private listeners: Map<string, ((messages: any[]) => void)[]> = new Map();

  addMessage(chatId: string, message: any) {
    const key = `chat_${chatId}`;
    if (!this.queue.has(key)) {
      this.queue.set(key, []);
    }
    this.queue.get(key)!.push(message);
    this.notifyListeners(key);
  }

  getMessages(chatId: string): any[] {
    const key = `chat_${chatId}`;
    return this.queue.get(key) || [];
  }

  clearMessages(chatId: string) {
    const key = `chat_${chatId}`;
    this.queue.delete(key);
    this.notifyListeners(key);
  }

  subscribe(chatId: string, callback: (messages: any[]) => void) {
    const key = `chat_${chatId}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(key: string) {
    const messages = this.queue.get(key) || [];
    const listeners = this.listeners.get(key) || [];
    listeners.forEach(callback => callback(messages));
  }
}

export const messageQueue = new MessageQueue();

export function useWidgetChats(publicKey: string) {
  return useQuery({
    queryKey: [api.widget.chats.list.path, publicKey],
    enabled: !!publicKey,
    queryFn: async () => {
      const params = new URLSearchParams({ publicKey });
      const url = `${api.widget.chats.list.path}?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch widget chats");
      return api.widget.chats.list.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Refetch every 5 seconds to get new chats and messages
  });
}

export function useWidgetChat(publicKey: string, id: number | null) {
  return useQuery({
    queryKey: [api.widget.chats.get.path, publicKey, id],
    enabled: !!id && !!publicKey,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const params = new URLSearchParams({ publicKey });
      const url = `${api.widget.chats.get.path.replace(':id', id.toString())}?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch widget chat details");
      return api.widget.chats.get.responses[200].parse(await res.json());
    },
  });
}

export function useWidgetSendMessage(publicKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      content,
    }: {
      chatId: number;
      content: string;
    }) => {
      const url = api.widget.chats.sendMessage.path.replace(':id', chatId.toString());
      const validated = api.widget.chats.sendMessage.input.parse({ publicKey, content });

      const res = await fetch(url, {
        method: api.widget.chats.sendMessage.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Failed to send message");
      return api.widget.chats.sendMessage.responses[201].parse(await res.json());
    },
  });
}
