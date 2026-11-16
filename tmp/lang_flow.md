# Language State Flow

## How lang state should update:

1. **LanguageProvider** (LangContext.jsx:10-29):
   - State: `const [lang, setLangState] = useState("ml")`
   - `setLang = (next) => { setLangState(next); saveMyLang({ data: { lang: next } }).catch(()); }`
   - Provider value: `{ lang, setLang, t }`

2. **LanguageToggle** (LangToggle.jsx):
   - `const { lang, setLang } = useLang()` - gets context value
   - On click: `onClick={() => setLang(option.code)}`
   - This calls LangContext's setLang, which updates state and saves to DB

3. **Components using language**:
   - `useLang()` → gets `{lang, setLang, t}` from context
   - `useLangPair()` → gets `{lang, primary, caption, leadFont, captionFont}`
   - Direct: `lang === "en" ? ... : ...` in Layout.jsx

## Potential Issues:

### A. Context not re-rendering
- If LanguageProvider doesn't wrap all components, lang changes won't propagate
- Check: Is LanguageProvider at the top of the component tree?

### B. setLang not updating state
- The `setLangState(next)` should update React state
- But if there's a stale closure, might not update

### C. DB save failing silently
- `saveMyLang({ data: { lang: next } }).catch(() => {})` - errors are swallowed
- But state update `setLangState(next)` should still work regardless of DB save

### D. Default value issue
- Context default: `lang: "ml"` (Line 4)
- Hook state: `useState("ml")` (Line 11)
- These should match, but if somehow the default overrides the hook...

## Verification Steps:

1. Click language toggle → does `lang` state update?
2. Check if UI text changes after clicking
3. Check browser console for errors
4. Check if `app_user_prefs` saves the selected language