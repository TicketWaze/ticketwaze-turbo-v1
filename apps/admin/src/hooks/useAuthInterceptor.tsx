// hooks/useAuthInterceptor.ts
import { useEffect } from "react";
import { signOut } from "next-auth/react";

export function useAuthInterceptor() {
  useEffect(() => {
    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        // Skip NextAuth's own API routes to avoid sign-out loops
        const url =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : "";
        if (url.includes("/api/auth/")) return response;

        await signOut({
          redirect: true,
          redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL}/auth/login`,
        });

        return response.clone();
      }

      return response;
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
}
