import LangToggle from "@/components/fund/LangToggle";
import { useLang } from "@/lib/LangContext";

// Full-screen card shared by the auth pages. The language picked here is remembered
// and saved to the account on first sign-in.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { t } = useLang();

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <span
          style={{ fontFamily: '"Archivo Black", "Plus Jakarta Sans", sans-serif' }}
          className="text-[1.3rem] leading-none"
        >
          FUND
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-[13px] text-muted-foreground sm:inline">{t("ഭാഷ", "Language")}</span>
          <LangToggle />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-8">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
