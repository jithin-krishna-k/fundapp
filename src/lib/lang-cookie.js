// The chosen language is mirrored into a cookie so the server can render the first
// paint in that language (localStorage alone is only readable after hydration,
// which made pages flash Malayalam → English on refresh). Safe to import in the browser.
export const LANG_COOKIE = "fund_lang";

/** Browser-side: remember the language for the next server render (1 year). */
export function writeLangCookie(lang) {
  if (typeof document === "undefined") return;
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}
