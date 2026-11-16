import { base44 } from "@/api/base44Client";

// Email + password sign-in through Neon Auth. Neon Auth has no MFA step, so the result never asks for one.
export async function loginWithMfa(email, password) {
  return base44.auth.loginViaEmailPassword(email, password);
}

export function loginWithGoogle(returnTo) {
  return base44.auth.loginWithProvider("google", returnTo);
}
