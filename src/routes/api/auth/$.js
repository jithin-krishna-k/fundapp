import { createFileRoute } from "@tanstack/react-router";
import { handleAuthProxyRequest } from "@neon/auth/server";
import { authConfig } from "@/lib/neon-auth.server";

// Same-origin proxy to Neon Auth (Managed Better Auth), so the session cookie is set on this app's origin.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      ANY: ({ request, params }) =>
        handleAuthProxyRequest({
          request,
          path: params._splat ?? "",
          baseUrl: authConfig.baseUrl,
          cookieSecret: authConfig.cookieSecret,
        }),
    },
  },
});
