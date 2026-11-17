import { Link } from "@tanstack/react-router";
import LangToggle from "@/components/fund/LangToggle";
import Logo from "@/components/fund/Logo";

// Full-screen card shared by the auth pages. The language picked here is remembered
// and saved to the account on first sign-in.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 border-b border-border pb-4">
        <Link to="/" aria-label="Home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
        </Link>
        <LangToggle />
      </div>

      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className={`mb-8 text-center ${Icon ? "" : "pt-2"}`}>
            {Icon && (
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
              </div>
            )}
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
