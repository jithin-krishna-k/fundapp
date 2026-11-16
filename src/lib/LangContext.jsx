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

  // The signed-in user's choice lives in Neon (app_user_prefs); signed out, the default (ml) applies.
  useEffect(() => {
    if (isLoadingAuth) return;
    getMyPrefs()
      .then((prefs) => {
        if (prefs?.lang === "ml" || prefs?.lang === "en") setLangState(prefs.lang);
      })
      .catch(() => {});
  }, [isLoadingAuth]);

  const setLang = (next) => {
    setLangState(next);
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