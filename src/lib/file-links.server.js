// Short-lived signed links for private uploads: `<fileId>.<expiresMs>.<signature>`.
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env.server";

const key = () => createHmac("sha256", requireEnv("NEON_AUTH_COOKIE_SECRET")).update("fund-file-links").digest();
const sign = (payload) => createHmac("sha256", key()).update(payload).digest("base64url");

export function signFileToken(id, expiresMs) {
  return `${id}.${expiresMs}.${sign(`${id}.${expiresMs}`)}`;
}

export function verifyFileToken(token) {
  const [id, expires, sig] = String(token || "").split(".");
  if (!id || !expires || !sig || Number(expires) < Date.now()) return null;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}
