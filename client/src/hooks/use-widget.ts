import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useWidgetConfig(publicKey: string) {
  return useQuery({
    queryKey: [api.widget.config.path, publicKey],
    enabled: !!publicKey,
    queryFn: async () => {
      const params = new URLSearchParams({ publicKey });
      const url = `${api.widget.config.path}?${params.toString()}`;

      console.log("Fetching widget config from URL:", url);

      const res = await fetch(url);
      const json = await res.json();

      console.log("💖 RAW widget config response:", json);

      if (!res.ok) throw new Error("Failed to fetch widget config");

      // Parse config if it's a string (database stores JSON as string)
      if (typeof json.config === 'string') {
        json.config = JSON.parse(json.config);
      }

      // ✅ PARSE THE SAME JSON
      return api.widget.config.responses[200].parse(json);
    },
  });
}
