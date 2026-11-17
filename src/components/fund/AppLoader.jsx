import { useLang } from "@/lib/LangContext";

// Full-screen loading screen shown while the session, language and fund data load.
export default function AppLoader() {
  const { t, ready } = useLang();

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6"
    >
      <span
        style={{ fontFamily: '"Archivo Black", "Plus Jakarta Sans", sans-serif' }}
        className="text-[2rem] leading-none text-foreground"
      >
        FUND
      </span>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="app-loader-bar h-full w-1/3 rounded-full bg-primary" />
      </div>
      {/* Until the language is known, avoid showing text in the wrong one. */}
      <p className="h-5 text-[14px] text-muted-foreground">
        {ready ? t("ഫണ്ട് വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു…", "Loading your fund…") : ""}
      </p>
    </div>
  );
}
