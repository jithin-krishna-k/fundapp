import { createContext, useContext, useEffect, useState } from "react";
import { getMyPrefs, saveMyLang } from "@/lib/backend-fns";
import { useAuth } from "@/lib/AuthContext";

const LanguageContext = createContext({
  lang: "ml",
  setLang: () => {},
  t: (ml, en) => ml || en,
});

export function LanguageProvider({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [lang, setLangState] = useState("ml");

  const remember = (value) => {
    try {
      localStorage.setItem("fund.lang", value);
    } catch {}
  };

  // Apply the locally remembered choice right away so the UI doesn't flash the default.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fund.lang");
      if (saved === "ml" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  // The signed-in user's choice lives in Neon (app_user_prefs) and wins once loaded.
  useEffect(() => {
    if (isLoadingAuth) return;
    getMyPrefs()
      .then((prefs) => {
        if (prefs?.lang === "ml" || prefs?.lang === "en") {
          setLangState(prefs.lang);
          remember(prefs.lang);
        }
      })
      .catch(() => {});
  }, [isLoadingAuth]);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    remember(next);
    if (isAuthenticated) saveMyLang({ data: { lang: next } }).catch(() => {});
  };

  const t = (ml, en) => (lang === "en" ? en || ml : ml || en);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
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