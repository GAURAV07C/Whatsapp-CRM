import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type AgentLoginRequest,
  type AgentLoginResponse,
  type MeResponse,
} from "@shared/routes";
import { useLocation } from "wouter";
import { socket } from "../lib/socket";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const token = localStorage.getItem("authToken");

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<MeResponse | null>({
    queryKey: [api.auth.me.path],
    enabled: !!token, // 🔥 ONLY run if token exists
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, {
        headers: {
          Authorization: token!, // 🔥 SEND TOKEN
        },
      });

      // console.log("Auth me response status:", res);

      if (res.status === 401) {
        localStorage.removeItem("authToken");
        return null;
      }

      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      // console.log("Frontend received user data:", data);

      return data as MeResponse;
    },
    retry: false,
  });

  // Join socket room when user is loaded
  useEffect(() => {
    if (user) {
      console.log("🔑 DEBUG: User authenticated, joining socket room:", {
        tenantId: user.tenantId,
        agentId: user.agentId,
      });
      socket.emit("join_room", {
        tenantId: user.tenantId,
        agentId: user.agentId,
      });
    } else {
      console.log("🔑 DEBUG: No user, not joining socket room");
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: AgentLoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      console.log("Login response status:", res);

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid username or password");
        throw new Error("Login failed");
      }

      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data: AgentLoginResponse) => {
      localStorage.setItem("authToken", data.token);

      // 🔥 immediately hydrate user state
      queryClient.setQueryData([api.auth.me.path], data.agent);

      setLocation("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("authToken");
      queryClient.setQueryData([api.auth.me.path], null);
    },
    onSuccess: () => {
      setLocation("/login");
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
  };
}
