"use client";

import { useState, useEffect } from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";
import { setAuthToken } from "@/lib/api";

function OAuthTokenSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token") || urlParams.get("auth_token");

    if (token) {
      setAuthToken(token);
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("auth_token");
      url.searchParams.delete("auth_success");
      url.searchParams.delete("user");
      window.history.replaceState({}, "", url.pathname + (url.search || ""));

      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.refetchQueries({ queryKey: ["auth", "me"] });

      if (
        window.location.pathname === "/sign-in" ||
        window.location.pathname === "/sign-up"
      ) {
        window.location.href = "/";
      }
    }
  }, [queryClient]);

  return null;
}

export function Providers({ children }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <OAuthTokenSync />
      {children}
    </QueryClientProvider>
  );
}

export default Providers;
