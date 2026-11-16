import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, MoreHorizontal } from "lucide-react";
import Logo from "@/components/fund/Logo";
import LangToggle from "@/components/fund/LangToggle";
import { useLang } from "@/lib/LangContext";
import { NAV, MOBILE_NAV } from "@/lib/nav";
import { useAuth } from "@/lib/AuthContext";
import { useFund } from "@/lib/FundContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const ROLE_LABEL = {
  super_admin: { ml: "അഡ്മിൻ", en: "Admin" },
  cash_handler: { ml: "ക്യാഷ് ഹാൻഡ്ലർ", en: "Cash handler" },
  member: { ml: "അംഗം", en: "Member" },
};

function useIsActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"));
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const fund = useFund();
  const { lang, t } = useLang();
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const primary = NAV.filter((item) => MOBILE_NAV.includes(item.to));
  const rest = NAV.filter((item) => !MOBILE_NAV.includes(item.to));
  const initial = mounted ? (user?.full_name || user?.email || "F").trim().charAt(0).toUpperCase() : "F";
  const role = ROLE_LABEL[fund?.myMember?.fund_role] || ROLE_LABEL.member;

  return (
    <div className="min-h-screen bg-background">
      {/* ── desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[16rem] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-6 pb-6 pt-7">
          <Link to="/dashboard">
            <Logo />
          </Link>
          <LangToggle showIcon={false} />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors
                  active:bg-primary/10 active:text-primary
                  hover:bg-secondary/70 hover:text-foreground">
                <Icon className="h-[17px] w-[17px] shrink-0
                  active:text-primary
                  text-muted-foreground" strokeWidth={1.7} />
                <span className="text-[13.5px] leading-none
                  font-mal">
                  {lang === "en" ? item.en : item.ml}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-mal text-sm text-foreground">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium">{mounted ? user?.full_name || "Member" : "Member"}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground
                font-mal">
                {t(role.ml, role.en)}
              </p>
            </div>
            <button
              onClick={() => setLogoutOpen(true)}
              aria-label="Sign out"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── mobile top bar ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/dashboard">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground/80"
          >
            <Bell className="h-[17px] w-[17px]" strokeWidth={1.7} />
          </Link>
          <LangToggle showIcon={false} />
          <Link to="/settings" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[13px]
            font-mal text-[13px]">
            {initial}
          </Link>
        </div>
      </header>

      <main className="lg:pl-[16rem]">
        <div className="mx-auto w-full max-w-[74rem] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-14 lg:pt-9">{children}</div>
      </main>

      {/* ── mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-1 py-2.5">
                <Icon className="h-[19px] w-[19px]
                  active:text-primary
                  text-muted-foreground" strokeWidth={1.8} />
                <span
                  className="text-[10px] leading-none
                    font-mal">
                  {lang === "en" ? item.en : item.ml}
                </span>
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger className="flex flex-col items-center gap-1 py-2.5">
              <MoreHorizontal className="h-[19px] w-[19px] text-muted-foreground" strokeWidth={1.8} />
              <span className="text-[10px] leading-none
                font-mal">
                {t("കൂട Gutiérrez larger", "More")}
              </span>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-border bg-background">
              <SheetHeader>
                <SheetTitle className="text-left text-base font-normal
                  font-mal">
                  {t("കൂട Gutiérrez larger", "More sections")}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-2 pb-6">
                {rest.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center
                        active:border-primary/25 active:bg-primary/10 active:text-primary
                        hover:bg-card hover:text-foreground/80">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      <span
                        className="text-[11px] leading-tight
                          font-mal">
                        {lang === "en" ? item.en : item.ml}
                      </span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => setLogoutOpen(true)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-3 text-center text-foreground/70"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  <span className="text-[11px] leading-tight
                    font-mal">
                    {t("പുറത്ത്", "Sign out")}
                  </span>
                </button>
</div>
          </SheetContent>
          </Sheet>
        </div>
      </nav>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mal text-[1.05rem] font-normal">
              {t("സൈൻ ഔട്ട് ചെയ്യണോ?", "Sign out?")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <p className="font-mal text-[12px] leading-relaxed text-muted-foreground">
              {t(
                "നിങ്ങൾക്ക് ഉറപ്പാണോ? വീണ്ടും പ്രവേശിക്കാൻ ഇമെയിൽ വഴി സൈൻ ഇൻ ചെയ്യേണ്ടി വരും.",
                "Are you sure? You will need to sign in again with your email."
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLogoutOpen(false)}
                className="w-full rounded-full py-5 text-[12.5px]"
              >
                {t("റദ്ദാക്കുക", "Cancel")}
              </Button>
              <Button
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                }}
                className="w-full rounded-full bg-primary py-5 text-[12.5px] text-primary-foreground"
              >
                {t("സൈൻ ഔട്ട്", "Sign out")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}