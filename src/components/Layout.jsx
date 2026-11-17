import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search, Settings2, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { inr } from "@/lib/format";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(localStorage.getItem("fund.sidebarCollapsed") === "1");
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fund.sidebarCollapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const primary = NAV.filter((item) => MOBILE_NAV.includes(item.to));
  const rest = NAV.filter((item) => !MOBILE_NAV.includes(item.to));
  const fullName = (user?.full_name || user?.email || "F").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const initial = mounted
    ? (nameParts.length > 1 ? nameParts[0][0] + nameParts[nameParts.length - 1][0] : fullName.slice(0, 2)).toUpperCase()
    : "";
  const role = ROLE_LABEL[fund?.myMember?.fund_role] || ROLE_LABEL.member;
  const unreadCount = (fund?.notifications || []).filter((n) => !n.read).length;
  const adminEmail = (fund?.members || []).find(
    (m) => m.fund_role === "super_admin" && m.user_email && m.user_email !== user?.email
  )?.user_email;

  return (
    <div className="min-h-screen bg-background">
      {/* ── desktop sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.75rem]" : "w-[14rem]"
        )}
      >
        <div className={cn("relative flex pb-5 pt-6", collapsed ? "flex-col items-center gap-2 px-3" : "px-5")}>
          <Link to="/dashboard" className={cn(collapsed ? "grid h-10 w-10 place-items-center" : "min-w-0")}>
            {collapsed ? (
              <span
                style={{ fontFamily: '"Archivo Black", "Plus Jakarta Sans", sans-serif' }}
                className="text-[1.25rem] leading-none text-foreground"
              >
                F
              </span>
            ) : (
              <Logo />
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("സൈഡ്ബാർ തുറക്കുക", "Expand sidebar") : t("സൈഡ്ബാർ അടയ്ക്കുക", "Collapse sidebar")}
            title={collapsed ? t("സൈഡ്ബാർ തുറക്കുക", "Expand sidebar") : t("സൈഡ്ബാർ അടയ്ക്കുക", "Collapse sidebar")}
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !collapsed && "absolute right-4 top-[1.3rem]"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[17px] w-[17px]" strokeWidth={1.7} />
            ) : (
              <PanelLeftClose className="h-[17px] w-[17px]" strokeWidth={1.7} />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            const label = lang === "en" ? item.en : item.ml;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl py-2.5 transition-colors",
                  collapsed ? "justify-center px-0" : "px-3.5",
                  active
                    ? "bg-accent font-semibold text-primary"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-foreground/70")}
                  strokeWidth={active ? 2.1 : 1.8}
                />
                {!collapsed && (
                  <span className={cn("truncate py-0.5 text-[15px] leading-5", lang === "en" ? "" : "font-mal")}>{label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        {!collapsed && (
          <div className="p-4">
            <div className="rounded-2xl bg-accent/70 px-4 py-5 text-center">
              <Users className="mx-auto h-7 w-7 text-primary" strokeWidth={1.9} />
              <p className={cn("mt-2 text-[14px] font-medium leading-snug", lang === "en" ? "" : "font-mal")}>
                {t("ഒരുമിച്ച് നമ്മൾ വളരുന്നു", "Together we grow stronger")}
              </p>
              {adminEmail && (
                <a
                  href={`mailto:${adminEmail}`}
                  className={cn(
                    "mt-3 inline-flex w-full items-center justify-center rounded-lg border border-primary/40 bg-card px-3 py-2 text-[13.5px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground",
                    lang === "en" ? "" : "font-mal"
                  )}
                >
                  {t("അഡ്മിനെ ബന്ധപ്പെടുക", "Contact admin")}
                </a>
              )}
            </div>
          </div>
        )}
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
            className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground/80"
          >
            <Bell className="h-[17px] w-[17px]" strokeWidth={1.7} />
            {unreadCount > 0 && (
              <span className="tnum absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <LangToggle compact />
          <ProfileMenu
            initial={initial}
            name={mounted ? user?.full_name || t("അംഗം", "Member") : ""}
            email={mounted ? user?.email : ""}
            role={t(role.ml, role.en)}
            onSignOut={() => setLogoutOpen(true)}
            compact
          />
        </div>
      </header>

      <main className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[4.75rem]" : "lg:pl-[14rem]")}>
        <div className="sticky top-0 z-20 hidden h-[4.5rem] items-center gap-4 border-b border-border bg-card/95 px-8 backdrop-blur-md lg:flex xl:px-10">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <LangToggle />
            <Link
              to="/notifications"
              aria-label={t("അറിയിപ്പുകൾ", "Notifications")}
              className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-secondary hover:text-primary"
            >
              <Bell className="h-[22px] w-[22px]" strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="tnum absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-card">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <ProfileMenu
              initial={initial}
              name={mounted ? user?.full_name || t("അംഗം", "Member") : ""}
              email={mounted ? user?.email : ""}
              role={t(role.ml, role.en)}
              onSignOut={() => setLogoutOpen(true)}
            />
          </div>
        </div>
        <div className="w-full max-w-[120rem] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-6 xl:px-10">{children}</div>
      </main>

      {/* ── mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 py-2.5", active ? "text-primary" : "text-muted-foreground")}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.1 : 1.8} />
                <span className={cn("text-[11.5px] leading-none", active && "font-medium", lang === "en" ? "" : "font-mal")}>
                  {lang === "en" ? item.en : item.ml}
                </span>
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger className="flex flex-col items-center gap-1 py-2.5">
              <MoreHorizontal className="h-[19px] w-[19px] text-muted-foreground" strokeWidth={1.8} />
              <span className="text-[11.5px] leading-none
                font-mal">
                {t("കൂടുതൽ", "More")}
              </span>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-border bg-background">
              <SheetHeader>
                <SheetTitle className="text-left text-base font-normal
                  font-mal">
                  {t("കൂടുതൽ വിഭാഗങ്ങൾ", "More sections")}
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
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center",
                        active
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground/80 hover:border-primary/25"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      <span
                        className="text-[12.5px] leading-tight
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
                  <span className="text-[12.5px] leading-tight
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
            <p className="font-mal text-[13.5px] leading-relaxed text-muted-foreground">
              {t(
                "നിങ്ങൾക്ക് ഉറപ്പാണോ? വീണ്ടും പ്രവേശിക്കാൻ ഇമെയിൽ വഴി സൈൻ ഇൻ ചെയ്യേണ്ടി വരും.",
                "Are you sure? You will need to sign in again with your email."
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLogoutOpen(false)}
                className="w-full rounded-full py-5 text-[14px]"
              >
                {t("റദ്ദാക്കുക", "Cancel")}
              </Button>
              <Button
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                }}
                className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground"
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

function ProfileMenu({ initial, name, email, role, onSignOut, compact = false }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("പ്രൊഫൈൽ മെനു", "Profile menu")}
        className={cn(
          "group flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-secondary",
          compact ? "" : "pr-2"
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-[14.5px] font-bold text-foreground">{initial}</span>
        {!compact && <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" strokeWidth={1.8} />}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 rounded-2xl p-0">
        <div className="px-4 py-3.5">
          <p className="truncate text-[14.5px] font-semibold">{name}</p>
          {email && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{email}</p>}
          <span className={cn("mt-2 inline-block rounded-full bg-accent px-2 py-0.5 text-[12px] text-primary", lang === "en" ? "" : "font-mal")}>
            {role}
          </span>
        </div>
        <div className="border-t border-border p-1.5">
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-foreground/85 transition-colors hover:bg-secondary"
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
            {t("ക്രമീകരണങ്ങൾ", "Settings")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.7} />
            {t("സൈൻ ഔട്ട്", "Sign out")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Top-bar search across pages, members and transactions. Enter opens the highlighted result.
function GlobalSearch() {
  const fund = useFund();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const q = query.trim().toLowerCase();
  const results = [];
  if (q) {
    for (const item of NAV) {
      if (item.en.toLowerCase().includes(q) || item.ml.includes(query.trim())) {
        results.push({ key: `p${item.to}`, to: item.to, icon: item.icon, title: lang === "en" ? item.en : item.ml, hint: t("പേജ്", "Page") });
      }
    }
    for (const m of fund?.members || []) {
      if ((m.full_name || "").toLowerCase().includes(q) || (m.user_email || "").toLowerCase().includes(q)) {
        results.push({ key: `m${m.id}`, to: "/members", icon: Users, title: m.full_name || m.user_email, hint: t("അംഗം", "Member") });
      }
    }
    for (const row of fund?.transactions || []) {
      if ((row.ref || "").toLowerCase().includes(q) || (row.member_name || "").toLowerCase().includes(q)) {
        results.push({
          key: `t${row.id}`,
          to: "/transactions",
          icon: NAV.find((n) => n.to === "/transactions")?.icon,
          title: `${row.ref || "—"} · ${row.member_name || "FUND"}`,
          hint: inr(row.amount),
        });
      }
    }
  }
  const shown = results.slice(0, 8);

  const go = (result) => {
    if (!result) return;
    setOpen(false);
    setQuery("");
    navigate({ to: result.to });
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" strokeWidth={1.9} />
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, shown.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            go(shown[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={t("പേജുകൾ, അംഗങ്ങൾ, ഇടപാടുകൾ തിരയുക…", "Search pages, members, transactions…")}
        aria-label={t("തിരയുക", "Search")}
        className={cn(
          "h-11 w-full rounded-full border border-border bg-background pl-11 pr-4 text-[14.5px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10",
          lang === "en" ? "" : "font-mal"
        )}
      />
      {open && q && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
          {shown.length === 0 ? (
            <p className="px-3 py-3 text-[14px] text-muted-foreground">{t("ഒന്നും കണ്ടെത്തിയില്ല", "No matches found")}</p>
          ) : (
            shown.map((result, index) => {
              const Icon = result.icon;
              return (
                <button
                  key={result.key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(result)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px]",
                    index === active ? "bg-accent text-primary" : "text-foreground/85"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />}
                  <span className="min-w-0 flex-1 truncate">{result.title}</span>
                  <span className="tnum shrink-0 text-[12.5px] text-muted-foreground">{result.hint}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
