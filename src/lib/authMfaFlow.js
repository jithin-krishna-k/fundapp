import { base44 } from '@/api/base44Client';

// Sign-in helpers shared by the auth pages. Identity is Neon Auth (Managed Better Auth); it has no
// two-step verification yet, so the MFA challenge / enrollment calls below report that plainly.
// Nothing here uses browser storage: the session is the Neon Auth cookie.

export class MfaError extends Error {
  constructor(message, status, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
  get mustSignInAgain() {
    return this.status === 401;
  }
}

const unavailable = async () => {
  throw new MfaError('Two-step verification is not available. Sign in with email and password.', 400);
};

export function mfaSession() {
  return {
    verify: unavailable,
    sendSignInCode: unavailable,
    setupAuthenticator: unavailable,
    confirmAuthenticator: unavailable,
    sendPhoneCode: unavailable,
    confirmPhone: unavailable,
    status: unavailable,
    sendProofCode: unavailable,
    removeMethod: unavailable,
    forgetDevices: unavailable,
  };
}

export const signInToManageMfa = unavailable;

// No challenge to resume: there is no MFA hand-off.
export async function resumeMfa() {
  return null;
}

// Email + password; Google through Neon Auth's shared OAuth credentials.
export async function loadSignInOptions() {
  return { auth_config: {} };
}

export function signInWithProvider(provider, returnTo) {
  return base44.auth.loginWithProvider(provider, returnTo);
}

export function finishSignIn(_accessToken, returnTo) {
  window.location.href = returnTo;
}
