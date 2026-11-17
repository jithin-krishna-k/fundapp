// English text for notifications. Notifications are written in Malayalam by the server;
// each template below maps one Malayalam wording (names/amounts captured) to English.
// New notifications store the result as title_en / body_en; older ones are translated on display.

const TITLES = {
  "പുതിയ അംഗ അഭ്യർത്ഥന": "New membership request",
  "പുതിയ ഓൺലൈൻ പേയ്‌മെന്റ്": "New online payment",
  "പുതിയ ഫണ്ട് അഭ്യർത്ഥന": "New fund request",
  "അടിയന്തിര അഭ്യർത്ഥന": "Emergency request",
  "അടിയന്തിര അഭ്യർത്ഥന നിരസിച്ചു": "Emergency request rejected",
  "അടിയന്തിര അഭ്യർത്ഥന അംഗീകരിച്ചു": "Emergency request approved",
  "പുതിയ ചെലവ് അനുമതിക്കായി": "New expense awaiting approval",
  "പലിശ വിതരണം": "Interest distributed",
  "നിയമ ഭേദഗതി നിർദ്ദേശം": "Rule change proposed",
  "നിയമ ഭേദഗതി നിരസിച്ചു": "Rule change rejected",
  "നിയമ ഭേദഗതി അംഗീകരിച്ചു": "Rule change approved",
  "ഫണ്ട് സൈക്കിൾ അവസാനിച്ചു": "Fund cycle closed",
  "പുതിയ ഫണ്ട് സൈക്കിൾ": "New fund cycle",
  "പുതിയ ക്യാഷ് ഹാൻഡ്ലർ": "New cash handler",
  "നിങ്ങൾ ഇനി അഡ്മിൻ": "You are now an admin",
  "അഡ്മിൻ പദവി മാറ്റി": "Admin role removed",
  "ആഴ്ച സംഭാവന ബാക്കി": "Weekly contribution due",
  "അംഗത്വം അനുവദിച്ചു": "Membership approved",
};

// [pattern, (...captures) => English]
const BODIES = [
  [/^(.+) അംഗത്വത്തിന് അപേക്ഷിച്ചു\. എല്ലാ അംഗങ്ങളുടെയും അനുവാദം ആവശ്യമാണ്\.$/, (n) => `${n} asked to join. Every member's approval is needed.`],
  [/^(.+) (₹[\d,.]+) ഓൺലൈൻ ആയി അയച്ചു\. സ്ക്രീൻഷോട്ട് പരിശോധിക്കുക\.$/, (n, a) => `${n} sent ${a} online. Check the screenshot.`],
  [/^(.+) (₹[\d,.]+) അടിയന്തിര സഹായം അഭ്യർത്ഥിച്ചു\. നിങ്ങളുടെ തീരുമാനം രേഖപ്പെടുത്തുക\.$/, (n, a) => `${n} asked for ${a} in emergency help. Record your decision.`],
  [/^(.+) ന്റെ (₹[\d,.]+) അഭ്യർത്ഥന ഗ്രൂപ്പിന്റെ തീരുമാനപ്രകാരം നിരസിച്ചു\.$/, (n, a) => `${n}'s ${a} request was rejected by the group's decision.`],
  [/^(.+) ന്റെ (₹[\d,.]+) അടിയന്തിര അഭ്യർത്ഥന എല്ലാവരുടെയും അനുമതിയോടെ അംഗീകരിച്ചു\.$/, (n, a) => `${n}'s ${a} emergency request was approved by everyone.`],
  [/^(.+) (₹[\d,.]+) ആവശ്യപ്പെട്ടു — (.*)$/, (n, a, p) => `${n} requested ${a} — ${p}`],
  [/^(.+) — (₹[\d,.]+)\. അനുമതി നൽകുക\.$/, (d, a) => `${d} — ${a}. Please review.`],
  [/^(₹[\d,.]+) വീതം എല്ലാ അംഗങ്ങൾക്കും പലിശ വിതരണം ചെയ്തു\.$/, (a) => `${a} of interest was paid to each member.`],
  [/^നിയമം (\S+) മാറ്റാൻ നിർദ്ദേശം\. അനുമതി നൽകുക\.$/, (r) => `A change to rule ${r} was proposed. Please review.`],
  [/^നിയമം (\S+) ഭേദഗതി നിരസിക്കപ്പെട്ടു\.$/, (r) => `The change to rule ${r} was rejected.`],
  [/^നിയമം (\S+) പുതിയ രൂപത്തിൽ പ്രാബല്യത്തിൽ വന്നു\.$/, (r) => `Rule ${r} is now in effect in its new form.`],
  [/^(.+) സൈക്കിൾ അവസാനിച്ചു\. അവസാന ബാലൻസ് (₹[\d,.]+)\.$/, (c, a) => `The ${c} cycle has closed. Final balance ${a}.`],
  [/^(.+) സൈക്കിൾ ആരംഭിച്ചു\.$/, (c) => `The ${c} cycle has started.`],
  [/^(.+) ഇനി ഫണ്ട് കൈകാര്യം ചെയ്യും\.$/, (n) => `${n} will now handle the fund's cash.`],
  [/^ഗ്രൂപ്പ് അഡ്മിൻ നിങ്ങളെ അഡ്മിൻ ആക്കി\.$/, () => "The group admin made you an admin."],
  [/^ഗ്രൂപ്പ് അഡ്മിൻ നിങ്ങളുടെ അഡ്മിൻ പദവി ഒഴിവാക്കി\.$/, () => "The group admin removed your admin role."],
  [/^(\S+) ലെ (₹[\d,.]+) സംഭാവന ഇതുവരെ അടച്ചിട്ടില്ല\.$/, (w, a) => `Your ${a} contribution for the week of ${w} hasn't been paid yet.`],
  [/^എല്ലാ അംഗങ്ങളുടെയും അനുമതിയോടെ നിങ്ങൾ ഗ്രൂപ്പിൽ ചേർന്നു\.$/, () => "You joined the group with every member's approval."],
];

/** English title/body for a notification; falls back to the original text when no template matches. */
export function notificationEnglish({ title = "", body = "", title_en, body_en } = {}) {
  let bodyEn = body_en;
  if (!bodyEn) {
    for (const [pattern, render] of BODIES) {
      const match = String(body).match(pattern);
      if (match) {
        bodyEn = render(...match.slice(1));
        break;
      }
    }
  }
  return { title_en: title_en || TITLES[title] || title, body_en: bodyEn || body };
}

/** Adds title_en / body_en to a notification payload before it is saved. */
export function withEnglish(payload) {
  return { ...payload, ...notificationEnglish(payload) };
}
