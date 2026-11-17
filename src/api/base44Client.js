// Drop-in replacement for the @base44/sdk client the pages were written against.
// Identity: Neon Auth (Managed Better Auth) through the same-origin /api/auth proxy, session in a cookie.
// Data: server functions in src/lib/backend-fns.js over Lakebase Postgres.
import { createAuthClient } from "@neon/auth";
import {
  authMe, createFileSignedUrl, entityCall, inviteUser, loginEmailStatus, uploadPrivateFile,
} from "@/lib/backend-fns";

// "" = this origin's /api/auth (the proxy in src/routes/api/auth/$.js).
export const authClient = createAuthClient("");

// Sessions live in an http-only cookie, so there is no bearer token in the browser.
export function getAccessToken() {
  return null;
}

const withStatus = (err, fallback) => {
  const e = err instanceof Error ? err : new Error(err?.message || fallback);
  e.status ??= err?.status ?? (/unauthorized/i.test(e.message) ? 401 : undefined);
  return e;
};

async function call(fn, data) {
  try {
    return await fn({ data });
  } catch (err) {
    throw withStatus(err, "Request failed");
  }
}

// Better Auth returns { data, error }; turn `error` into a thrown Error with its status.
async function auth(promise, fallback) {
  let res;
  try {
    res = await promise;
  } catch (err) {
    throw withStatus(err, fallback);
  }
  if (res?.error) {
    throw Object.assign(new Error(res.error.message || res.error.statusText || fallback), { status: res.error.status });
  }
  return res?.data;
}

const absolute = (url) => new URL(url || "/", window.location.origin).href;

const ENTITY_METHODS = ["list", "filter", "get", "count", "create", "bulkCreate", "update", "updateMany", "delete", "deleteMany"];

const entities = new Proxy(
  {},
  {
    get(cache, entity) {
      if (typeof entity !== "string") return undefined;
      return (cache[entity] ||= Object.fromEntries(
        ENTITY_METHODS.map((op) => [op, (...args) => call(entityCall, { entity, op, args })]),
      ));
    },
  },
);

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const base44 = {
  entities,
  auth: {
    // The cookie is http-only, so "maybe": me() answers 401 when there is no session.
    hasToken: () => typeof window !== "undefined",
    setToken: () => {},
    me: () => call(authMe),
    // Better Auth answers "Invalid email or password" for unknown emails too; on failure, ask the
    // server which case it is and tag the error with a code the login page can translate.
    loginViaEmailPassword: async (email, password) => {
      try {
        return await auth(authClient.signIn.email({ email, password }), "Invalid email or password");
      } catch (err) {
        if (err.status !== 401 && !/invalid email or password/i.test(err.message)) throw err;
        const status = await call(loginEmailStatus, { email }).catch(() => null);
        if (status && !status.registered) {
          throw Object.assign(new Error("This email is not registered"), { status: err.status, code: "EMAIL_NOT_REGISTERED" });
        }
        if (status && !status.hasPassword) {
          throw Object.assign(new Error("This account uses Google sign-in"), { status: err.status, code: "NO_PASSWORD" });
        }
        throw Object.assign(err, { code: err.code || "INVALID_CREDENTIALS" });
      }
    },
    // With "Verify email at signup" off (the branch default) sign-up signs the user straight in.
    register: async ({ email, password, full_name }) => {
      const data = await auth(
        authClient.signUp.email({ email, password, name: full_name || email.split("@")[0] }),
        "Registration failed",
      );
      return { signedIn: !!data?.user && !!(data?.token || data?.session), user: data?.user };
    },
    verifyOtp: ({ email, otpCode }) => auth(authClient.emailOtp.verifyEmail({ email, otp: otpCode }), "Invalid verification code"),
    resendOtp: (email) =>
      auth(authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" }), "Failed to resend code"),
    resetPasswordRequest: (email) =>
      auth(authClient.requestPasswordReset({ email, redirectTo: absolute("/reset-password") }), "Could not send reset email"),
    resetPassword: ({ resetToken, newPassword }) =>
      auth(authClient.resetPassword({ newPassword, token: resetToken }), "Could not reset password"),
    logout: async (redirectUrl) => {
      await authClient.signOut().catch(() => {});
      window.location.href = redirectUrl || "/";
    },
    redirectToLogin: (returnTo) => {
      const url = new URL("/login", window.location.origin);
      if (returnTo) url.searchParams.set("returnTo", returnTo);
      window.location.href = url.href;
    },
    loginWithProvider: async (provider, returnTo) => {
      const callbackURL = absolute(returnTo || "/dashboard");
      const data = await auth(
        authClient.signIn.social({ provider, callbackURL, newUserCallbackURL: callbackURL }),
        `Unable to sign in with ${provider}`,
      );
      if (data?.url) window.location.href = data.url;
      return data;
    },
  },
  users: {
    inviteUser: (email, role) => call(inviteUser, { email, role }),
  },
  integrations: {
    Core: {
      UploadPrivateFile: async ({ file }) =>
        call(uploadPrivateFile, { name: file.name, type: file.type, base64: await fileToBase64(file) }),
      CreateFileSignedUrl: ({ file_uri, expires_in }) => call(createFileSignedUrl, { file_uri, expires_in }),
    },
  },
};
