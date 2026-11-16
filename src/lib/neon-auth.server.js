// Neon Auth (Managed Better Auth) on the server. The browser talks to Neon Auth through the same-origin
// proxy at /api/auth (src/routes/api/auth/$.js), so the session cookie lives on this app's origin and
// server functions read it with auth.getSession().
import { createAuthServer, extractNeonAuthCookies } from "@neon/auth/server";
import { getRequest, setCookie } from "@tanstack/react-start/server";
import { requireEnv } from "@/lib/env.server";

export const authConfig = {
  get baseUrl() {
    return requireEnv("NEON_AUTH_BASE_URL");
  },
  get cookieSecret() {
    return requireEnv("NEON_AUTH_COOKIE_SECRET"); // 32+ characters
  },
};

let server;

export function getAuth() {
  server ||= createAuthServer({
    baseUrl: authConfig.baseUrl,
    cookieSecret: authConfig.cookieSecret,
    context: () => {
      const request = getRequest();
      return {
        getCookies: () => extractNeonAuthCookies(request.headers),
        setCookie,
        getHeader: (name) => request.headers.get(name),
        getOrigin: () => request.headers.get("origin") ?? new URL(request.url).origin,
        getFramework: () => "tanstack-start",
      };
    },
  });
  return server;
}

// The app's user shape (what server-fns.js and the UI read): id, email, full_name, role.
export const toAppUser = (u) =>
  u && { id: u.id, email: String(u.email || "").toLowerCase(), full_name: u.name || u.email, role: u.role || "user" };

// The signed-in user for this request, or null. Reads the session cookie (no token in the request body).
export async function sessionUser() {
  const { data } = await getAuth().getSession();
  return toAppUser(data?.user);
}
