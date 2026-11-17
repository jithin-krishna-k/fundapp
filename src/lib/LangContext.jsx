import { createContext, useContext, useEffect, useState } from "react";
import { getMyPrefs, saveMyLang } from "@/lib/backend-fns";
import { useAuth } from "@/lib/AuthContext";
import { writeLangCookie } from "@/lib/lang-cookie";

const LanguageContext = createContext({
  lang: "ml",
  setLang: () => {},
  t: (ml, en) => ml || en,
  ready: true,
});

// initialLang comes from the fund_lang cookie on the server, so the first paint
// is already in the chosen language.
export function LanguageProvider({ children, initialLang }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [lang, setLangState] = useState(initialLang === "en" ? "en" : "ml");
  // False until the saved choice (browser, then account) has been applied.
  const [ready, setReady] = useState(false);

  const remember = (value) => {
    try {
      localStorage.setItem("fund.lang", value);
    } catch {}
    writeLangCookie(value);
  };

  const readLocal = () => {
    try {
      const saved = localStorage.getItem("fund.lang");
      return saved === "ml" || saved === "en" ? saved : null;
    } catch {
      return null;
    }
  };

  // Apply the locally remembered choice right away so the UI doesn't flash the default.
  // (Older visits only stored localStorage; copy that into the cookie for next time.)
  useEffect(() => {
    const saved = readLocal();
    if (saved) {
      setLangState(saved);
      if (saved !== initialLang) writeLangCookie(saved);
    }
  }, []);

  // Signed in: the account's saved language wins. A first sign-in (nothing saved yet)
  // stores the language the user picked on the login/register page.
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      setReady(true);
      return;
    }
    let cancelled = false;
    getMyPrefs()
      .then((prefs) => {
        if (cancelled) return;
        if (prefs?.lang === "ml" || prefs?.lang === "en") {
          setLangState(prefs.lang);
          remember(prefs.lang);
        } else {
          const picked = readLocal() || "ml";
          setLangState(picked);
          saveMyLang({ data: { lang: picked } }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoadingAuth, isAuthenticated]);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    remember(next);
    if (isAuthenticated) saveMyLang({ data: { lang: next } }).catch(() => {});
  };

  const t = (ml, en) => (lang === "en" ? en || ml : ml || en);

  return <LanguageContext.Provider value={{ lang, setLang, t, ready }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

// Decides which language leads on screen and which follows as the small caption.
export function useLangPair() {
  const { lang } = useLang();
  return {
    lang,
    primary: (ml, en) => (lang === "en" ? en || ml : ml || en),
    caption: (ml, en) => (lang === "en" ? ml || en : en || ml),
    leadFont: lang === "en" ? "" : "font-mal",
    captionFont: lang === "en" ? "font-mal" : "",
  };
}