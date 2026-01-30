import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { authFetch } from "@/lib/authFetch";

export function useChats() {
  return useQuery({
    queryKey: [api.chats.list.path],
    queryFn: async () => {
      const res = await authFetch(api.chats.list.path);
      if (!res.ok) throw new Error("Failed to fetch chats");
      return api.chats.list.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Refetch every 10 seconds to get new chats
  });
}

export function useChat(id: number | null) {
  return useQuery({
    queryKey: [api.chats.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.chats.get.path, { id });
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to fetch chat details");
      return api.chats.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      remoteJid,
      customerName,
    }: {
      remoteJid: string;
      customerName?: string;
    }) => {
      const validated = api.chats.create.input.parse({
        remoteJid,
        customerName,
      });

      const res = await authFetch(api.chats.create.path, {
        method: api.chats.create.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Failed to create chat");
      return api.chats.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      content,
    }: {
      chatId: number;
      content: string;
    }) => {
      const url = buildUrl(api.chats.sendMessage.path, { id: chatId });
      const validated = api.chats.sendMessage.input.parse({ content });

      const res = await authFetch(url, {
        method: api.chats.sendMessage.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: number) => {
      console.log("Attempting to delete chat:", chatId);
      const response = await authFetch(
        buildUrl(api.chats.delete.path, { id: chatId }),
        {
          method: api.chats.delete.method,
        },
      );
      console.log("Delete response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete failed:", errorText);
        throw new Error(
          `Failed to delete chat: ${response.status} ${errorText}`,
        );
      }
      const result = await response.json();
      console.log("Delete successful:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Invalidating chat queries");
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
    },
  });
}
