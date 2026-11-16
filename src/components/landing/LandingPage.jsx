import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileBarChart2,
  HandCoins,
  Percent,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

const WHATSAPP_URL = "https://chat.whatsapp.com/G3eiyehyWr6JKNsy8qVtvv";

function WhatsAppIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.87 11.87 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.91-11.9 0-3.18-1.24-6.17-3.46-8.44ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.38a9.84 9.84 0 0 1-1.51-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.44 9.9-9.9 9.9Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.91-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}
import Logo from "@/components/fund/Logo";
import { useAuth } from "@/lib/AuthContext";

const PRINCIPLES = [
  {
    title: "The same amount, every week",
    body: "A fixed contribution on a fixed date. Everyone sees the same week, the same row.",
  },
  {
    title: "Interest returns to the fund",
    body: "Borrowing interest belongs to the group, not to an outside lender.",
  },
  {
    title: "One ledger, open to all",
    body: "Contributions, loans and repayments are visible to every member, always.",
  },
];

const FEATURES = [
  {
    icon: HandCoins,
    title: "Weekly contributions",
    body: "Generate the week in one tap and see exactly who has paid and who is pending.",
  },
  {
    icon: Percent,
    title: "Loans and interest",
    body: "Loan amounts, borrowing interest and repayments are calculated for you.",
  },
  {
    icon: ShieldCheck,
    title: "Emergency pool",
    body: "A separate pool for emergencies, released only when every member agrees.",
  },
  {
    icon: Scale,
    title: "Rules, written down",
    body: "The group's rules live in the app, with proposals and approvals on record.",
  },
  {
    icon: FileBarChart2,
    title: "Reports that add up",
    body: "Weekly, monthly and per-member statements, ready to read or print.",
  },
  {
    icon: Users,
    title: "Membership by approval",
    body: "New members join only when the group agrees. No silent additions.",
  },
];

const STEPS = [
  {
    title: "Accept the invite",
    body: "The group admin invites you by email. You join once the members approve.",
  },
  {
    title: "Contribute each week",
    body: "Pay your week's amount and keep the receipt and verification in one place.",
  },
  {
    title: "Borrow, repay, close",
    body: "Borrow from the pool when needed, with interest and balances tracked to the rupee.",
  },
];

const HERO_ROWS = [
  { name: "A. Rahman", detail: "Week 24 · contribution", amount: "₹250", state: "Paid" },
  { name: "Jithin K.", detail: "Week 24 · contribution", amount: "₹250", state: "Paid" },
  { name: "Niya T.", detail: "Week 24 · contribution", amount: "₹250", state: "Due" },
];

function LedgerPanel() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card/95 shadow-[0_40px_90px_-55px_rgba(60,35,20,0.55)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-[12px] font-semibold text-primary-foreground">
              ₹
            </span>
            <div className="text-left">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Shared ledger</p>
              <p className="text-[14px] font-semibold">FUND cycle 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              ₹750 this week
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px border-b border-border bg-border/70">
          {[
            { label: "Balance", value: "₹48,250" },
            { label: "Members", value: "12" },
            { label: "Weekly", value: "₹250" },
          ].map((item) => (
            <div key={item.label} className="bg-card px-4 py-3 text-center sm:px-5">
              <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
              <p className="tnum mt-1 text-[15px] font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <ul className="divide-y divide-border/70 px-5 sm:px-6">
          {HERO_ROWS.map((row) => (
            <li key={row.name} className="flex items-center gap-3 py-4 text-left">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${row.state === "Paid"
                  ? "bg-emerald-700/10 text-emerald-800"
                  : "bg-primary/10 text-primary"
                  }`}
              >
                {row.state === "Paid" ? <Check className="h-4 w-4" strokeWidth={2} /> : "•"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{row.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{row.detail}</p>
              </div>
              <div className="text-right">
                <p className="tnum text-[13px] font-semibold">{row.amount}</p>
                <p
                  className={`mt-0.5 text-[10px] uppercase tracking-[0.14em] ${row.state === "Paid" ? "text-emerald-700" : "text-primary"
                    }`}
                >
                  {row.state}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card/70 px-5 py-3.5 text-[11px] text-muted-foreground sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={1.7} />
            Every entry visible to every member
          </span>
          <span className="uppercase tracking-[0.14em]">3 of 4 paid · Rule 9 protected</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Signed-in members belong in the app, not on the marketing page.
  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const primaryTo = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Sign in";

  return (
    <div className="land-paper min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link to="/" aria-label="FUND home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {!user && (
              <Link
                to="/register"
                className="hidden rounded-full px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Request access
              </Link>
            )}
            <Link
              to={primaryTo}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11.5px] font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              {primaryLabel}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.9} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
            <div className="absolute left-[10%] bottom-[5%] h-[14rem] w-[14rem] rounded-full bg-emerald-700/10 blur-3xl" />
            <div className="absolute right-[10%] top-[15%] h-[12rem] w-[12rem] rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:py-12">
            <div className="land-rise mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/70 px-2 py-1.5 pr-4 backdrop-blur-sm">
                <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground">
                  Members only
                </span>
                <span className="text-[11px] text-muted-foreground">Private weekly fund, fully tracked</span>
              </div>

              <h1 className="mt-4 font-display text-[2.8rem] leading-[0.98] tracking-[-0.03em] sm:text-[4rem] lg:mt-5 lg:text-[5rem]">
                Your group&apos;s money,
                <br />
                <span>counted clearly.</span>
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/70 sm:mt-5 sm:text-[17px]">
                FUND keeps weekly contributions, loans, interest and repayments in one shared ledger — so every
                member sees the same truth, every week.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to={primaryTo}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[13px] font-medium text-primary-foreground shadow-[0_14px_30px_-18px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/70 px-6 py-3 text-[13px] font-medium text-foreground/85 transition-colors hover:border-primary/30 hover:text-foreground sm:w-auto"
                  >
                    Request membership
                  </Link>
                )}
              </div>

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 border-t border-border/80 pt-5">
                {[
                  { value: "₹250", label: "Every week" },
                  { value: "1", label: "Shared ledger" },
                  { value: "100%", label: "Member-visible" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="tnum font-display text-[1.35rem] leading-none sm:text-[1.6rem]">{stat.value}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="land-rise mt-8 sm:mt-10" style={{ animationDelay: "120ms" }}>
              <LedgerPanel />
            </div>
          </div>
        </section>

        {/* ticker */}
        <section className="border-y border-border/70 bg-card/60">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:px-8">
            <span>₹250 weekly</span>
            <span className="hidden h-1 w-1 rounded-full bg-primary/40 sm:block" />
            <span>One shared ledger</span>
            <span className="hidden h-1 w-1 rounded-full bg-primary/40 sm:block" />
            <span>Members only</span>
          </div>
        </section>

        {/* principles */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            {PRINCIPLES.map((item, index) => (
              <article key={item.title} className="relative pl-6">
                <span className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />
                <p className="text-[10px] uppercase tracking-[0.22em] text-primary/80">0{index + 1}</p>
                <h2 className="mt-3 font-display text-[1.35rem] leading-tight">{item.title}</h2>
                <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/65">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* features */}
        <section className="border-t border-border/70 bg-card/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-xl">
              <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-px w-8 bg-primary/50" />
                What is inside
              </p>
              <h2 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.4rem]">
                The whole fund,
                <br />
                <span className="text-primary">in one place.</span>
              </h2>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group rounded-[1.4rem] border border-border bg-background/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_40px_-34px_rgba(60,35,20,0.5)]"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/20 bg-primary/[0.06] text-primary">
                      <Icon className="h-4 w-4" strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-4 text-[15px] font-medium leading-tight">{feature.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground/65">{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-px w-8 bg-primary/50" />
                How it works
              </p>
              <h2 className="mt-4 font-display text-[2rem] leading-tight sm:text-[2.4rem]">Three steps.</h2>
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-foreground/65">
                From the first week to the closing balance, without a single loose end.
              </p>
            </div>

            <ol className="space-y-0">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-5 border-t border-border/70 py-6 first:border-t-0 first:pt-0">
                  <span className="font-display text-[2.2rem] leading-none text-primary/35">0{index + 1}</span>
                  <div>
                    <h3 className="text-[15px] font-medium leading-tight">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground/65">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* rule quote */}
        <section className="border-y border-border/70 bg-primary/[0.05]">
          <div className="mx-auto w-full max-w-4xl px-5 py-14 text-center sm:px-8 sm:py-16">
            <p className="font-display text-[1.5rem] leading-snug sm:text-[1.9rem]">
              “No new member without everyone&apos;s consent.”
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">FUND rule 9</p>
          </div>
        </section>

        {/* final CTA */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="land-rise flex flex-col items-start justify-between gap-6 rounded-[1.6rem] border border-primary/20 bg-card p-6 shadow-[0_30px_60px_-50px_rgba(60,35,20,0.6)] sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-display text-[1.6rem] leading-tight sm:text-[1.9rem]">Already part of the circle?</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/65">
                Sign in with your email. The rest of the ledger will be waiting.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Link
                to={primaryTo}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-medium text-primary-foreground sm:flex-none"
              >
                {primaryLabel}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.9} />
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="flex flex-1 items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-[12.5px] font-medium text-foreground/80 sm:flex-none"
                >
                  Register
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-6 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span className="font-display text-[0.8rem] tracking-[0.24em] text-foreground/70">FUND</span>
      <span className="flex flex-col gap-1 sm:items-end sm:text-right"><span>Members only · Private fund group</span><span className="normal-case tracking-[0.08em]">Created by Jithin Krishna</span></span>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Join WhatsApp group"
        title="Join WhatsApp group"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-12px_rgba(37,211,102,0.8)] transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe57] sm:bottom-6 sm:right-6"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-40 [animation-duration:1.8s]" />
        <WhatsAppIcon className="relative h-7 w-7" />
      </a>
</div>
  );
}
