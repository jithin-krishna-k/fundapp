import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { authMiddleware, base44RequestMiddleware } from "@/lib/auth-middleware";
import { errorCaptureFunctionMiddleware, errorCaptureRequestMiddleware } from "@/lib/error-capture";

// Server functions are same-origin RPC endpoints that act on the visitor's session cookie, so reject
// cross-site calls to them (checks Sec-Fetch-Site / Origin / Referer). Runs first.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// Every server function and server route gets `context.getBase44()`, acting as the visitor.
// Error capture comes next, so it sees what the other middlewares and the handlers throw.
export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, errorCaptureRequestMiddleware, base44RequestMiddleware],
  functionMiddleware: [errorCaptureFunctionMiddleware, authMiddleware],
}));
