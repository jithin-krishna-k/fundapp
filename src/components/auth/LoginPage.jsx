import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MfaFlow } from "@/components/auth/MfaFlow";
import { MfaScreen } from "@/components/auth/MfaParts";
import { loginWithMfa } from "@/lib/authMfa";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useLang } from "@/lib/LangContext";

// The /login page. ?returnTo= (or the platform's ?from_url=) is where the visitor
// goes after signing in — the login gate and the MCP consent page send people here with it.
export function LoginPage() {
  const { t } = useLang();
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await loginWithMfa(email, password);
      if (result.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      // A hard redirect: the app re-initializes with the new session.
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || t("ഇമെയിലോ പാസ്‌വേഡോ തെറ്റാണ്", "Invalid email or password"));
      setBusy(false);
    }
  }

  // The second sign-in step (authenticator app or text message) replaces the whole page.
  if (mfaChallenge) return <MfaScreen><MfaFlow challenge={mfaChallenge} returnTo={returnTo} /></MfaScreen>;

  return (
    <AuthLayout icon={LogIn} title={t("വീണ്ടും സ്വാഗതം", "Welcome back")} subtitle={t("നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് പ്രവേശിക്കുക", "Log in to your account")}>
      <GoogleButton returnTo={returnTo} onError={setError} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{t("ഇമെയിൽ", "Email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="login-email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t("പാസ്‌വേഡ്", "Password")}</Label>
            <AuthLink to="/forgot-password" returnTo={returnTo} className="text-xs text-primary hover:underline">
              {t("പാസ്‌വേഡ് മറന്നോ?", "Forgot password?")}
            </AuthLink>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel={t("പ്രവേശിക്കുന്നു…", "Logging in…")}>
          {t("പ്രവേശിക്കുക", "Log in")}
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("അക്കൗണ്ട് ഇല്ലേ?", "Don't have an account?")}{" "}
        <AuthLink to="/register" returnTo={returnTo}>
          {t("പുതിയത് സൃഷ്ടിക്കുക", "Create one")}
        </AuthLink>
      </p>
    </AuthLayout>
  );
}
