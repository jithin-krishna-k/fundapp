import { createFileRoute } from "@tanstack/react-router";
import { handleAuthProxyRequest } from "@neon/auth/server";
import { authConfig } from "@/lib/neon-auth.server";

// Same-origin proxy to Neon Auth (Managed Better Auth), so the session cookie is set on this app's origin.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      ANY: async ({ request, params }) => {
        try {
          return await handleAuthProxyRequest({
            request,
            path: params._splat ?? "",
            baseUrl: authConfig.baseUrl,
            cookieSecret: authConfig.cookieSecret,
          });
        } catch (err) {
          if (err?.name === "AbortError" || err?.code === "ABORT_ERR") {
            return new Response(null, { status: 499 });
          }
          throw err;
        }
      },
    },
  },
});
