import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useWidgetConfig(publicKey: string) {
  return useQuery({
    queryKey: [api.widget.config.path, publicKey],
    enabled: !!publicKey,
    queryFn: async () => {
      // In a real GET request with params, we usually append query string
      // But wouter/api spec here defines input schema. 
      // Assuming the backend handles query params mapping or we send as query string.
      const params = new URLSearchParams({ publicKey });
      const url = `${api.widget.config.path}?${params.toString()}`;

      console.log("Fetching widget config from URL:", url);
      console.log("With publicKey:", publicKey);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch widget config");
      return api.widget.config.responses[200].parse(await res.json());
    },
  });
}
