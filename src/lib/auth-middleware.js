import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { entityStore } from "@/lib/db.server";
import { sessionUser } from "@/lib/neon-auth.server";

// What `context.getBase44()` returns: the entity API on Lakebase Postgres, acting as the session's user.
// server-fns.js uses `.asServiceRole`; authorization happens in those handlers, as it did on Base44.
function createServerClient() {
  let me;
  const actor = () => (me ??= sessionUser().catch(() => null));
  const entities = new Proxy({}, { get: (cache, name) => (typeof name === "string" ? (cache[name] ||= entityStore(name, actor)) : undefined) });
  const client = {
    entities,
    auth: {
      me: async () => {
        const user = await actor();
        if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
        return user;
      },
    },
  };
  client.asServiceRole = client;
  return client;
}

const withGetBase44 = (next) => {
  let client;
  return next({ context: { getBase44: () => (client ??= createServerClient()) } });
};

// Applied to every server function by src/start.js. The session travels in the same-origin auth cookie,
// so the client half adds nothing.
export const authMiddleware = createMiddleware({ type: "function" }).server(({ next }) => withGetBase44(next));

export const base44RequestMiddleware = createMiddleware({ type: "request" }).server(({ next }) => withGetBase44(next));

const currentUser = (context) =>
  context
    .getBase44()
    .auth.me()
    .catch((error) => {
      if (error?.status === 401 || error?.status === 403) return null;
      throw error;
    });

// Rejects anonymous callers and sets `context.user`.
export const requireUser = createMiddleware({ type: "function" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) {
    setResponseStatus(401);
    throw Object.assign(new Error("Unauthorized"), { status: 401, code: "UNAUTHORIZED" });
  }
  return next({ context: { user } });
});

export const requireUserRoute = createMiddleware({ type: "request" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return next({ context: { user } });
});
