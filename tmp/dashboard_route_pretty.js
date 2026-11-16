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
