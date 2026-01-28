import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getAuthHeaders } from "../lib/utils";

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: [api.whatsapp.status.path],
    queryFn: async () => {
      const res = await fetch(api.whatsapp.status.path, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch WhatsApp status");
      return api.whatsapp.status.responses[200].parse(await res.json());
    },
    refetchInterval: (query) => {
      // Poll faster if we are waiting for QR scan
      const status = query.state.data?.status;
      return status === "qr_ready" ? 2000 : 10000;
    },
  });
}

export function useWhatsAppLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.whatsapp.logout.path, {
        method: api.whatsapp.logout.method,
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to logout WhatsApp");
      return api.whatsapp.logout.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.whatsapp.status.path] });
    },
  });
}
