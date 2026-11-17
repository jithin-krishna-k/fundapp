import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { MfaFlow } from "@/components/auth/MfaFlow";
import { MfaScreen } from "@/components/auth/MfaParts";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useLang } from "@/lib/LangContext";

const isAlreadyVerified = (err) => err?.status === 400 && /already verified/i.test(err?.message ?? "");
const isAlreadyRegistered = (err) =>
  err?.status === 422 || /already (registered|exists)|user .*exists|email .*exists/i.test(err?.message ?? "");

/**
 * The /register page: register → OTP → verifyOtp → setToken. Registration alone
 * does not sign the user in (the account is unverified), so the code step is never
 * skipped and loginViaEmailPassword is never called right after register.
 */
export function RegisterPage() {
  const { t } = useLang();
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  async function register(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("പാസ്‌വേഡുകൾ ഒരുപോലെയല്ല", "Passwords do not match"));
      return;
    }
    setBusy(true);
    try {
      const result = await base44.auth.register({ email, password });
      // Neon Auth signs the user in at sign-up unless "Verify email at signup" is on for the branch.
      if (result?.signedIn) {
        window.location.href = returnTo;
        return;
      }
      setStep("otp");
    } catch (err) {
      if (isAlreadyRegistered(err)) {
        setStep("already_registered");
        return;
      }
      setError(err.message || t("രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു", "Registration failed"));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = returnTo;
    } catch (err) {
      // Verified server-side but the answer never arrived: the code is spent and
      // there is no token, so the only way forward is a normal sign-in.
      if (isAlreadyVerified(err)) setStep("already_verified");
      else setError(err.message || t("കോഡ് തെറ്റാണ്", "Invalid verification code"));
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast(t("കോഡ് അയച്ചു", "Code sent"), { description: t("പുതിയ കോഡിനായി ഇമെയിൽ പരിശോധിക്കുക.", "Check your email for the new code.") });
    } catch (err) {
      if (isAlreadyVerified(err)) setStep("already_verified");
      else setError(err.message || t("കോഡ് വീണ്ടും അയക്കാനായില്ല", "Failed to resend code"));
    }
  }

  // The account is verified; the second sign-in step replaces the whole page and finishes signing in.
  if (mfaChallenge) return <MfaScreen><MfaFlow challenge={mfaChallenge} returnTo={returnTo} /></MfaScreen>;

  if (step === "already_verified") {
    return (
      <AuthLayout title={t("അക്കൗണ്ട് സൃഷ്ടിക്കുക", "Create your account")} subtitle={t("ആരംഭിക്കാൻ രജിസ്റ്റർ ചെയ്യുക", "Sign up to get started")}>
        <p className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{email}</span> {t("ഇതിനകം സ്ഥിരീകരിച്ചതാണ്. തുടരാൻ പ്രവേശിക്കുക.", "is already verified. Sign in to continue.")}
        </p>
        <AuthLink to="/login" returnTo={returnTo} className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {t("പ്രവേശിക്കുക", "Sign in")}
        </AuthLink>
      </AuthLayout>
    );
  }

  if (step === "already_registered") {
    return (
      <AuthLayout title={t("നിങ്ങൾക്ക് ഇതിനകം ഒരു അക്കൗണ്ട് ഉണ്ട്", "You already have an account")}>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{email}</span>{" "}
          {t(
            "ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. പ്രവേശിച്ച് തുടരുക. പാസ്‌വേഡ് ഓർമ്മയില്ലെങ്കിൽ, പുതിയത് സജ്ജമാക്കാം.",
            "is already registered. Just log in to continue. Don't remember your password? You can set a new one.",
          )}
        </p>
        <div className="space-y-3">
          <AuthLink to="/login" returnTo={returnTo} className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {t("പ്രവേശിക്കുക", "Log in")}
          </AuthLink>
          <AuthLink to="/forgot-password" returnTo={returnTo} className="inline-flex h-12 w-full items-center justify-center rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            {t("പാസ്‌വേഡ് മറന്നോ?", "Forgot password?")}
          </AuthLink>
        </div>
      </AuthLayout>
    );
  }

  if (step === "otp") {
    return (
      <AuthLayout title={t("അക്കൗണ്ട് സൃഷ്ടിക്കുക", "Create your account")} subtitle={t("ആരംഭിക്കാൻ രജിസ്റ്റർ ചെയ്യുക", "Sign up to get started")}>
        <form onSubmit={verify}>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("6 അക്ക കോഡ് അയച്ചത്:", "We sent a 6-digit code to")} <span className="font-medium text-foreground">{email}</span>
          </p>
          <AuthError>{error}</AuthError>
          <div className="mb-6 flex justify-center">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <SubmitButton busy={busy} busyLabel={t("സ്ഥിരീകരിക്കുന്നു…", "Verifying…")} disabled={busy || otpCode.length < 6}>
            {t("സ്ഥിരീകരിക്കുക", "Verify")}
          </SubmitButton>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("കോഡ് ലഭിച്ചില്ലേ?", "Didn't receive the code?")}{" "}
            <button type="button" onClick={resend} className="font-medium text-primary hover:underline">
              {t("വീണ്ടും അയക്കുക", "Resend")}
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("അക്കൗണ്ട് സൃഷ്ടിക്കുക", "Create your account")} subtitle={t("ആരംഭിക്കാൻ രജിസ്റ്റർ ചെയ്യുക", "Sign up to get started")}>
      <GoogleButton returnTo={returnTo} onError={setError} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-email">{t("ഇമെയിൽ", "Email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">{t("പാസ്‌വേഡ്", "Password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm">{t("പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക", "Confirm password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 pl-10" disabled={busy} required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel={t("അക്കൗണ്ട് സൃഷ്ടിക്കുന്നു…", "Creating account…")}>
          {t("അക്കൗണ്ട് സൃഷ്ടിക്കുക", "Create account")}
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?", "Already have an account?")}{" "}
        <AuthLink to="/login" returnTo={returnTo}>
          {t("പ്രവേശിക്കുക", "Log in")}
        </AuthLink>
      </p>
    </AuthLayout>
  );
}
