import { C as e, f as t, l as n, t as r, x as i } from "./createLucideIcon-zx7jp-LO.js";
import { t as a } from "./link-qMSuP26m.js";
import { t as o } from "./bell-BNhefwxT.js";
import { n as s, t as c } from "./hand-coins-DobzoJwI.js";
import { t as l } from "./siren-WDXWh45P.js";
import { A as u, D as d, M as f, N as p, O as m, j as h, n as g } from "./FundContext-D72JGFkK.js";
import { i as _, r as v } from "./index-CazmELYM.js";
import { t as y } from "./SectionHeading-B7aDAC96.js";
import { t as b } from "./banknote-D9w1Bk-c.js";
import { t as x } from "./scale-CXRvICKb.js";
import { t as S } from "./percent-leKgAxup.js";
import { t as C } from "./EmptyState-Duwq7G5F.js";
var w = r(`ArrowUpRight`, [
    [`path`, { d: `M7 7h10v10`, key: `1tivn9` }],
    [`path`, { d: `M7 17 17 7`, key: `1vkiza` }],
  ]),
  T = r(`ClipboardCheck`, [
    [`rect`, { width: `8`, height: `4`, x: `8`, y: `2`, rx: `1`, ry: `1`, key: `tgr4d6` }],
    [
      `path`,
      { d: `M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2`, key: `116196` },
    ],
    [`path`, { d: `m9 14 2 2 4-4`, key: `df797q` }],
  ]),
  E = r(`FileText`, [
    [`path`, { d: `M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z`, key: `1rqfz7` }],
    [`path`, { d: `M14 2v4a2 2 0 0 0 2 2h4`, key: `tnqrlb` }],
    [`path`, { d: `M10 9H8`, key: `b1mrlr` }],
    [`path`, { d: `M16 13H8`, key: `t4e002` }],
    [`path`, { d: `M16 17H8`, key: `z1uh3a` }],
  ]),
  D = e(i(), 1),
  O = t(),
  k = [
    [14, 14, 0.54],
    [38, 14, 0.36],
    [62, 14, 0.18],
    [86, 14, 0],
    [38, 38, 0.54],
    [62, 38, 0.36],
    [86, 38, 0.18],
    [62, 62, 0.54],
    [86, 62, 0.36],
    [86, 86, 0.54],
  ];
function A(e, t) {
  let [n, r] = (0, D.useState)(e);
  return (
    (0, D.useEffect)(() => {
      if (!t || typeof window > `u` || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) return;
      let n,
        i,
        a = (t) => {
          i ||= t;
          let o = Math.min((t - i) / 1100, 1);
          (r(e * (1 - (1 - o) ** 3)), o < 1 && (n = requestAnimationFrame(a)));
        };
      return (r(0), (n = requestAnimationFrame(a)), () => cancelAnimationFrame(n));
    }, [e, t]),
    n
  );
}
function j({ labelMl: e, labelEn: t, value: r, prefix: i = `₹`, details: a = [], featured: o = !1 }) {
  let s = (0, D.useRef)(null),
    { lang: c, primary: l, caption: u, leadFont: d, captionFont: p } = _(),
    [m, h] = (0, D.useState)(!1);
  (0, D.useEffect)(() => {
    let e = s.current;
    if (!e || typeof IntersectionObserver > `u`) {
      h(!0);
      return;
    }
    let t = new IntersectionObserver(
      (e) => {
        e[0]?.isIntersecting && (h(!0), t.disconnect());
      },
      { threshold: 0.25 },
    );
    return (t.observe(e), () => t.disconnect());
  }, []);
  let g = A(Number(r) || 0, m);
  return (0, O.jsxs)(`article`, {
    ref: s,
    className: n(
      `group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] transition-all duration-500`,
      o
        ? `col-span-2 border border-primary/15 p-5 shadow-[0_26px_55px_-40px_rgba(84,42,20,0.6)] sm:p-6`
        : `border border-border bg-card p-5 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_36px_-30px_rgba(0,0,0,0.5)] sm:p-6`,
    ),
    style: o
      ? {
          backgroundImage: `radial-gradient(125% 125% at 100% 0%, rgba(201,103,64,0.26) 0%, rgba(201,103,64,0.10) 34%, rgba(247,244,236,0) 66%), linear-gradient(160deg, #FBF1E8 0%, #F5F1E6 100%)`,
        }
      : void 0,
    children: [
      (0, O.jsxs)(`div`, {
        className: `relative flex items-start justify-between gap-4`,
        children: [
          (0, O.jsxs)(`div`, {
            className: `min-w-0`,
            children: [
              (0, O.jsx)(`p`, {
                className: n(`text-[12.5px] font-medium leading-snug text-foreground/85`, d),
                children: l(e, t),
              }),
              (0, O.jsx)(`p`, {
                className: n(
                  `mt-1 text-[10px] leading-snug text-muted-foreground/80`,
                  p,
                  c === `ml` ? `uppercase tracking-[0.16em]` : `tracking-normal`,
                ),
                children: u(e, t),
              }),
            ],
          }),
          o &&
            (0, O.jsx)(`svg`, {
              viewBox: `0 0 100 100`,
              className: `h-12 w-12 shrink-0 opacity-80 sm:h-14 sm:w-14`,
              fill: `hsl(var(--primary))`,
              "aria-hidden": `true`,
              children: k.map(([e, t, n], r) =>
                (0, O.jsx)(
                  `circle`,
                  {
                    cx: e,
                    cy: t,
                    r: 9,
                    style: {
                      transformBox: `fill-box`,
                      transformOrigin: `center`,
                      transform: m ? `scale(1)` : `scale(0.82)`,
                      opacity: m ? 1 : 0.3,
                      transition: `transform .5s cubic-bezier(.22,1,.36,1) ${n}s, opacity .5s ease ${n}s`,
                    },
                  },
                  r,
                ),
              ),
            }),
        ],
      }),
      (0, O.jsxs)(`div`, {
        className: `relative mt-5`,
        children: [
          (0, O.jsxs)(`p`, {
            className: `font-display tnum text-[2rem] leading-none tracking-tight sm:text-[2.4rem]`,
            children: [
              (0, O.jsx)(`span`, { className: `mr-1 text-[0.55em] text-muted-foreground/70`, children: i }),
              f(g),
            ],
          }),
          a.length > 0 &&
            (0, O.jsx)(`dl`, {
              className: `mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-primary/10 bg-primary/[0.07]`,
              children: a.map((e) =>
                (0, O.jsxs)(
                  `div`,
                  {
                    className: `bg-white/55 px-3.5 py-2.5`,
                    children: [
                      (0, O.jsx)(`dt`, {
                        className: `font-mal text-[10.5px] leading-none text-muted-foreground`,
                        children: e.label,
                      }),
                      (0, O.jsx)(`dd`, {
                        className: `tnum mt-1 text-[13px] font-medium text-foreground`,
                        children: e.value,
                      }),
                    ],
                  },
                  e.label,
                ),
              ),
            }),
        ],
      }),
    ],
  });
}
var M = [
  [14, 14, 0.54],
  [38, 14, 0.36],
  [62, 14, 0.18],
  [86, 14, 0],
  [38, 38, 0.54],
  [62, 38, 0.36],
  [86, 38, 0.18],
  [62, 62, 0.54],
  [86, 62, 0.36],
  [86, 86, 0.54],
];
function N(e, t) {
  let [n, r] = (0, D.useState)(e);
  return (
    (0, D.useEffect)(() => {
      if (!t || typeof window > `u` || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) return;
      let n,
        i,
        a = (t) => {
          i ||= t;
          let o = Math.min((t - i) / 1100, 1);
          (r(e * (1 - (1 - o) ** 3)), o < 1 && (n = requestAnimationFrame(a)));
        };
      return (r(0), (n = requestAnimationFrame(a)), () => cancelAnimationFrame(n));
    }, [e, t]),
    n
  );
}
function P({ week: e }) {
  let t = (0, D.useRef)(null),
    { primary: r, caption: i, leadFont: a, captionFont: o } = _(),
    [s, c] = (0, D.useState)(!1);
  (0, D.useEffect)(() => {
    let e = t.current;
    if (!e || typeof IntersectionObserver > `u`) {
      c(!0);
      return;
    }
    let n = new IntersectionObserver(
      (e) => {
        e[0]?.isIntersecting && (c(!0), n.disconnect());
      },
      { threshold: 0.25 },
    );
    return (n.observe(e), () => n.disconnect());
  }, []);
  let l = N(Number(e.value) || 0, s);
  return (0, O.jsxs)(`article`, {
    ref: t,
    className: n(
      `relative flex flex-col justify-between gap-6 overflow-hidden rounded-[1.4rem] p-5 transition-all duration-500 sm:p-6`,
      e.week === `featured`
        ? `col-span-2 border border-primary/15 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.45)]`
        : `border border-border bg-card hover:border-primary/25 hover:shadow-[0_14px_30px_-26px_rgba(0,0,0,0.5)]`,
    ),
    children: [
      (0, O.jsxs)(`div`, {
        className: `relative flex items-start justify-between gap-3`,
        children: [
          (0, O.jsxs)(`div`, {
            className: `min-w-0`,
            children: [
              (0, O.jsx)(`p`, {
                className: n(`text-[13px] leading-tight text-muted-foreground`, a),
                children: r(e.labelMl, e.labelEn),
              }),
              (0, O.jsx)(`p`, {
                className: n(`mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80`, o),
                children: i(e.labelMl, e.labelEn),
              }),
            ],
          }),
          e.featured &&
            (0, O.jsx)(`svg`, {
              viewBox: `0 0 100 100`,
              className: `h-12 w-12 shrink-0 sm:h-14 sm:w-14`,
              fill: `hsl(var(--primary))`,
              "aria-hidden": `true`,
              children: M.map(([e, t, n], r) =>
                (0, O.jsx)(
                  `circle`,
                  {
                    cx: e,
                    cy: t,
                    r: 9,
                    style: {
                      transformBox: `fill-box`,
                      transformOrigin: `center`,
                      transform: s ? `scale(1)` : `scale(0.82)`,
                      opacity: s ? 1 : 0.3,
                      transition: `transform .5s cubic-bezier(.22,1,.36,1) ${n}s, opacity .5s ease ${n}s`,
                    },
                  },
                  r,
                ),
              ),
            }),
        ],
      }),
      (0, O.jsxs)(`div`, {
        className: `relative`,
        children: [
          (0, O.jsxs)(`p`, {
            className: `font-display tnum text-[2rem] leading-none tracking-tight sm:text-[2.35rem]`,
            children: [
              (0, O.jsx)(`span`, {
                className: `mr-0.5 text-[0.6em] text-muted-foreground/70`,
                children: e.prefix,
              }),
              u(l),
            ],
          }),
          e.details?.length > 0 &&
            (0, O.jsx)(`dl`, {
              className: `mt-4 flex flex-wrap gap-x-6 gap-y-2`,
              children: e.details.map((e) =>
                (0, O.jsxs)(
                  `div`,
                  {
                    children: [
                      (0, O.jsx)(`dt`, {
                        className: `font-mal text-[11px] text-muted-foreground`,
                        children: e.label,
                      }),
                      (0, O.jsx)(`dd`, {
                        className: `tnum text-[13px] font-medium text-foreground`,
                        children: e.value,
                      }),
                    ],
                  },
                  e.label,
                ),
              ),
            }),
        ],
      }),
    ],
  });
}
var F = [
  { to: `/contributions`, ml: `സംഭാവന അടയ്ക്കുക`, en: `Pay contribution`, icon: c },
  { to: `/request-fund`, ml: `ഫണ്ട് ആവശ്യപ്പെടുക`, en: `Request fund`, icon: b },
  { to: `/emergency`, ml: `അടിയന്തിര അഭ്യർത്ഥന`, en: `Emergency`, icon: l },
  { to: `/transactions`, ml: `ഇടപാടുകൾ`, en: `Transactions`, icon: s },
  { to: `/rules`, ml: `ഫണ്ട് നിയമങ്ങൾ`, en: `Fund rules`, icon: x },
];
function I() {
  let { primary: e, caption: t, leadFont: r, captionFont: i } = _();
  return (0, O.jsxs)(`section`, {
    className: `rounded-[1.4rem] border border-border bg-card p-5`,
    children: [
      (0, O.jsx)(`h2`, {
        className: n(`text-[15px] leading-tight`, r),
        children: e(`വേഗത്തിലുള്ള നടപടികൾ`, `Quick actions`),
      }),
      (0, O.jsx)(`p`, {
        className: n(`mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground`, i),
        children: t(`വേഗത്തിലുള്ള നടപടികൾ`, `Quick actions`),
      }),
      (0, O.jsx)(`div`, {
        className: `mt-4 grid grid-cols-2 gap-2`,
        children: F.map((o, s) => {
          let c = o.icon;
          return (0, O.jsxs)(
            a,
            {
              to: o.to,
              className:
                (s === F.length - 1 ? `col-span-2 ` : ``) +
                `group flex items-center gap-3 rounded-xl border border-border/80 bg-background/60 px-3 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.06]`,
              children: [
                (0, O.jsx)(`span`, {
                  className: `grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary`,
                  children: (0, O.jsx)(c, { className: `h-4 w-4`, strokeWidth: 1.7 }),
                }),
                (0, O.jsxs)(`span`, {
                  className: `min-w-0`,
                  children: [
                    (0, O.jsx)(`span`, {
                      className: n(`block text-[12.5px] leading-tight`, r),
                      children: e(o.ml, o.en),
                    }),
                    (0, O.jsx)(`span`, {
                      className: n(`block text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground`, i),
                      children: t(o.ml, o.en),
                    }),
                  ],
                }),
              ],
            },
            o.to,
          );
        }),
      }),
    ],
  });
}
var L = { contribution: c, withdrawal: b, repayment: s, interest: S, request: E, emergency: l };
function R({ items: e }) {
  let { primary: t, caption: r, leadFont: i, captionFont: a } = _(),
    { lang: o } = v();
  return (0, O.jsxs)(`section`, {
    className: `rounded-[1.4rem] border border-border bg-card p-5 sm:p-6`,
    children: [
      (0, O.jsx)(`div`, {
        className: `flex items-end justify-between`,
        children: (0, O.jsxs)(`div`, {
          children: [
            (0, O.jsx)(`h2`, {
              className: n(`text-[15px] leading-tight`, i),
              children: t(`സമീപകാൽ ഇടപാടുകൾ`, `Recent activity`),
            }),
            (0, O.jsx)(`p`, {
              className: n(`mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground`, a),
              children: r(`സമീപകçal ഇടപാടുകൾ`, `Recent activity`),
            }),
          ],
        }),
      }),
      (0, O.jsx)(`ul`, {
        className: `mt-4 divide-y divide-border/70`,
        children: e.map((e, r) => {
          let i = L[e.type] || E;
          return (0, O.jsxs)(
            `li`,
            {
              className: `flex items-center gap-3 py-3`,
              children: [
                (0, O.jsx)(`span`, {
                  className: `grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 bg-background text-muted-foreground`,
                  children: (0, O.jsx)(i, { className: `h-4 w-4`, strokeWidth: 1.7 }),
                }),
                (0, O.jsxs)(`div`, {
                  className: `min-w-0 flex-1`,
                  children: [
                    (0, O.jsx)(`p`, {
                      className: n(
                        `truncate`,
                        o === `en` ? `text-[12.5px] leading-tight` : `font-mal text-[12.5px] leading-tight`,
                      ),
                      children: t(e.ml, e.en),
                    }),
                    (0, O.jsxs)(`p`, {
                      className: `mt-1 truncate text-[10.5px] text-muted-foreground`,
                      children: [
                        e.meta,
                        ` `,
                        (0, O.jsx)(`span`, { className: `mx-1 text-border`, children: `·` }),
                        ` `,
                        e.when,
                      ],
                    }),
                  ],
                }),
                (0, O.jsx)(`p`, {
                  className: `tnum shrink-0 text-[12.5px] font-medium`,
                  children: u(e.amount),
                }),
              ],
            },
            r,
          );
        }),
      }),
    ],
  });
}
var z = {
    weekly_contribution: `contribution`,
    fund_withdrawal: `withdrawal`,
    loan_repayment: `repayment`,
    late_interest: `interest`,
    borrowing_interest: `interest`,
    fund_expense: `withdrawal`,
    interest_distribution: `interest`,
    other: `request`,
  },
  B = {
    weekly_contribution: { ml: `ആഴ്ച സംഭാവന`, en: `Weekly contribution` },
    fund_withdrawal: { ml: `ഫണ്ട് വായ്പ നൽകി`, en: `Fund lent out` },
    loan_repayment: { ml: `വായ്പ തിരിച്ചടവ്`, en: `Loan repayment` },
    late_interest: { ml: `കാലതാമസ പലിശ`, en: `Late interest` },
    borrowing_interest: { ml: `വായ്പ പലിശ`, en: `Borrowing interest` },
    fund_expense: { ml: `ഫണ്ട് ചെലവ്`, en: `Fund expense` },
    interest_distribution: { ml: `പലിശ വിതരണം`, en: `Interest distribution` },
    other: { ml: `മറ്റ് ഇടപാട്`, en: `Other transaction` },
  };
function V() {
  let e = g(),
    { lang: t, t: r } = v(),
    {
      settings: i,
      summary: s,
      members: f,
      myMember: _,
      transactions: b,
      withdrawals: x,
      weekContributions: S,
    } = e,
    [E, k] = (0, D.useState)(``);
  (0, D.useEffect)(() => {
    k(m(new Date(), t === `en` ? `en-IN` : `ml-IN`));
  }, [t]);
  let A = h(p(new Date())),
    M = h(d(p(new Date()), 6)),
    N = S.filter((e) => e.status === `paid`),
    F = S.filter((e) => e.status !== `paid`),
    L = (_?.full_name || ``).split(` `)[0],
    V = b.filter((e) => e.status === `pending`).length,
    H = x.filter((e) => [`submitted`, `under_review`].includes(e.status)).length,
    U = b.slice(0, 6).map((e) => {
      let t = B[e.category];
      return {
        type: z[e.category] || `request`,
        title: `${e.member_name || `FUND`} · ${t ? r(t.ml, t.en) : r(`മറ്റ് ഇടപാട്`, `Other transaction`)}`,
        meta: `${e.method === `cash` ? r(`ക്യാഷ്`, `Cash`) : r(`ഓൺലൈൻ`, `Online`)} · ${e.status === `verified` ? r(`പരിശോധിച്ചു`, `Verified`) : e.status === `pending` ? r(`പരിശോധനയിൽ`, `Pending`) : r(`നിരസിച്ചു`, `Rejected`)} · ${e.ref || ``}`,
        amount: Number(e.amount) || 0,
        when: m(e.txn_date || e.created_date),
      };
    });
  return (0, O.jsxs)(`div`, {
    className: `page-enter space-y-7`,
    children: [
      (0, O.jsxs)(`header`, {
        className: `flex items-start justify-between gap-4`,
        children: [
          (0, O.jsxs)(`div`, {
            children: [
              (0, O.jsx)(`p`, {
                className: `font-mal text-[11px] uppercase tracking-[0.2em] text-muted-foreground`,
                children: E || `\xA0`,
              }),
              (0, O.jsxs)(`h1`, {
                className: n(
                  `mt-2 text-[1.6rem] leading-tight sm:text-[1.9rem]`,
                  t === `en` ? `` : `font-mal`,
                ),
                children: [r(`നമസ്കാരം`, `Welcome`), L ? `, ${L}` : ``],
              }),
              (0, O.jsxs)(`p`, {
                className: n(
                  `mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground`,
                  t === `en` ? `font-mal` : ``,
                ),
                children: [e.cycle?.name || `Fund group`, ` · `, r(`അംഗങ്ങൾക്ക് മാത്രം`, `members only`)],
              }),
            ],
          }),
          (0, O.jsxs)(a, {
            to: `/notifications`,
            "aria-label": `Notifications`,
            className: `relative hidden h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground/75 transition-colors hover:border-primary/30 hover:text-primary sm:grid`,
            children: [
              (0, O.jsx)(o, { className: `h-[18px] w-[18px]`, strokeWidth: 1.7 }),
              e.notifications.some((e) => !e.read) &&
                (0, O.jsx)(`span`, {
                  className: `absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary`,
                }),
            ],
          }),
        ],
      }),
      (0, O.jsxs)(`section`, {
        children: [
          (0, O.jsx)(y, {
            ml: `സാമ്പത്തിക സ്ഥിതി`,
            en: `Financial summary`,
            action: (0, O.jsx)(a, {
              to: `/reports`,
              className: `text-[11px] uppercase tracking-[0.14em] text-primary hover:underline`,
              children: `Reports`,
            }),
          }),
          (0, O.jsxs)(`div`, {
            className: `grid grid-cols-2 gap-3 lg:grid-cols-4`,
            children: [
              (0, O.jsx)(j, {
                featured: !0,
                labelMl: `ആകെ ഫണ്ട് ബാലൻസ്`,
                labelEn: `Total fund balance`,
                value: s.balance,
                details: [
                  { label: `ക്യാഷ്`, value: u(s.cashBalance) },
                  { label: `അംഗങ്ങൾ`, value: String(s.members) },
                ],
              }),
              (0, O.jsx)(j, {
                labelMl: `ആകെ സംഭാവന`,
                labelEn: `Total contributions`,
                value: s.contributionsTotal,
              }),
              (0, O.jsx)(j, { labelMl: `നൽകിയ വായ്പ`, labelEn: `Total money lent`, value: s.lent }),
              (0, O.jsx)(j, { labelMl: `ബാക്കി തുക`, labelEn: `Total outstanding`, value: s.outstanding }),
              (0, O.jsx)(j, {
                labelMl: `ലഭിച്ച പലിശ`,
                labelEn: `Interest collected`,
                value: s.interestCollected,
              }),
              (0, O.jsx)(j, {
                labelMl: `ഈ ആഴ്ചയിലെ ശേഖരണം`,
                labelEn: `Collected this week`,
                value: S.reduce((e, t) => e + Number(t.amount_paid || 0), 0),
              }),
              (0, O.jsx)(j, {
                labelMl: `ആകെ അംഗങ്ങൾ`,
                labelEn: `Total members`,
                value: s.members,
                prefix: ``,
              }),
            ],
          }),
        ],
      }),
      (V > 0 || H > 0) &&
        (e.isHandler || e.isAdmin) &&
        (0, O.jsxs)(`section`, {
          className: `grid gap-3 sm:grid-cols-2`,
          children: [
            V > 0 &&
              (0, O.jsxs)(a, {
                to: `/transactions`,
                className: `flex items-center gap-3 rounded-[1.2rem] border border-primary/20 bg-primary/[0.06] px-4 py-3.5`,
                children: [
                  (0, O.jsx)(`span`, {
                    className: `grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary`,
                    children: (0, O.jsx)(T, { className: `h-4 w-4`, strokeWidth: 1.8 }),
                  }),
                  (0, O.jsxs)(`span`, {
                    className: `min-w-0 flex-1`,
                    children: [
                      (0, O.jsx)(`span`, {
                        className: n(`block text-[12.5px]`, t === `en` ? `` : `font-mal`),
                        children: r(`പരിശോധിക്കാനുള്ള പേയ്‌മെന്റുകൾ`, `Payments to verify`),
                      }),
                      (0, O.jsxs)(`span`, {
                        className: n(
                          `block text-[10px] uppercase tracking-[0.14em] text-muted-foreground`,
                          t === `en` ? `font-mal` : ``,
                        ),
                        children: [V, ` `, r(`പരിശോധനയിൽ`, `pending verification`)],
                      }),
                    ],
                  }),
                  (0, O.jsx)(w, { className: `h-4 w-4 text-primary`, strokeWidth: 1.7 }),
                ],
              }),
            H > 0 &&
              (0, O.jsxs)(a, {
                to: `/request-fund`,
                className: `flex items-center gap-3 rounded-[1.2rem] border border-border bg-card px-4 py-3.5`,
                children: [
                  (0, O.jsx)(`span`, {
                    className: `grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground/70`,
                    children: (0, O.jsx)(c, { className: `h-4 w-4`, strokeWidth: 1.8 }),
                  }),
                  (0, O.jsxs)(`span`, {
                    className: `min-w-0 flex-1`,
                    children: [
                      (0, O.jsx)(`span`, {
                        className: n(`block text-[12.5px]`, t === `en` ? `` : `font-mal`),
                        children: r(`അനുമതിക്കായുള്ള ഫണ്ട് അഭ്യർത്ഥനകൾ`, `Fund requests awaiting approval`),
                      }),
                      (0, O.jsxs)(`span`, {
                        className: n(
                          `block text-[10px] uppercase tracking-[0.14em] text-muted-foreground`,
                          t === `en` ? `font-mal` : ``,
                        ),
                        children: [H, ` `, r(`തീരുമാനത്തിനായി കാത്തിരിക്കുന്നു`, `awaiting decision`)],
                      }),
                    ],
                  }),
                  (0, O.jsx)(w, { className: `h-4 w-4 text-muted-foreground`, strokeWidth: 1.7 }),
                ],
              }),
          ],
        }),
      (0, O.jsxs)(`section`, {
        className: `grid gap-4 lg:grid-cols-3`,
        children: [
          (0, O.jsx)(`div`, {
            className: `lg:col-span-2`,
            children:
              S.length === 0
                ? (0, O.jsx)(`div`, {
                    className: `rounded-[1.4rem] border border-border bg-card p-5 sm:p-6`,
                    children: (0, O.jsx)(C, {
                      icon: c,
                      ml: `ഈ ആഴ്ചയുടെ സംഭാവന രേഖകൾ ഇല്ല`,
                      en: `This week's contributions are not generated yet`,
                      action: (0, O.jsx)(a, {
                        to: `/contributions`,
                        className: `rounded-full bg-primary px-4 py-2 text-[11.5px] text-primary-foreground`,
                        children: r(`സംഭാവന വിഭാഗത്തിലേക്ക്`, `Go to contributions`),
                      }),
                    }),
                  })
                : (0, O.jsx)(P, {
                    week: {
                      amount: i?.weekly_amount || 250,
                      paid: N.length,
                      total: S.length,
                      range: `${m(A)} – ${m(M)}`,
                      deadline: m(M),
                      next: m(h(d(A, 7))),
                      paidMembers: N.map((e) => e.member_name),
                      pendingMembers: F.map((e) => e.member_name),
                    },
                  }),
          }),
          (0, O.jsx)(I, {}),
        ],
      }),
      U.length === 0
        ? (0, O.jsxs)(`section`, {
            children: [
              (0, O.jsx)(y, { ml: `സമീപകാല ഇടപാടുകൾ`, en: `Recent activity` }),
              (0, O.jsx)(C, {
                icon: l,
                ml: `ഇടപാടുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല`,
                en: `No transactions recorded yet`,
                action: (0, O.jsx)(a, {
                  to: `/contributions`,
                  className: `rounded-full bg-primary px-4 py-2 text-[11.5px] text-primary-foreground`,
                  children: r(`ആദ്യ സംഭാവന രേഖപ്പെടുത്തുക`, `Record the first contribution`),
                }),
              }),
            ],
          })
        : (0, O.jsx)(R, { items: U }),
      (0, O.jsx)(`p`, {
        className: `pb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70`,
        children: `Transparency · Trust · Friendship · Accountability`,
      }),
    ],
  });
}
export { V as component };
