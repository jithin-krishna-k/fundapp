// Server-only: reads the fund_lang cookie for the current request.
import { getCookie } from "@tanstack/react-start/server";
import { LANG_COOKIE } from "@/lib/lang-cookie";

export function readLangCookie() {
  const value = getCookie(LANG_COOKIE);
  return value === "en" || value === "ml" ? value : null;
}
