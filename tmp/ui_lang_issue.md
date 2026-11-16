# UI Language Issue - Malayalam Shows Even When English Selected

## Problem
User selects English, but Malayalam text still appears in the UI.

## What's Working
✅ Language preference saved to DB: `app_user_prefs.lang = 'en'` confirmed
✅ LangToggle filters options: shows only opposite language
✅ Context setup: LanguageProvider wraps all components

## Likely Causes

### 1. Components using direct `lang` reference instead of context
Some components may be using their own `lang` state or not reading from LanguageContext.

### 2. Hardcoded Malayalam strings outside the `t()` function
Some UI text may use hardcoded Malayalam without going through the translation function.

### 3. useEffect re-running issues
The `lang` state might not be triggering re-renders in all components.

### 4. Default values overriding user preference
Some components might have default Malayalam text that doesn't check the `lang` state.

## Investigation Areas

### Check all `lang === "en"` conditions in UI components:

From earlier grep, these use `lang === "en"`:
- Layout.jsx lines 56-66: sidebar nav language labels ✅
- Layout.jsx line 78: font class ✅  
- Layout.jsx line 79: "Members only" text uses `t()` ✅
- Layout.jsx lines 129-133, 141, 147, 166-167, 177: font classes ✅
- Dashboard components use `useLangPair()` ✅
- Fund components use `useLangPair()` or `useLang()` ✅

### Components to verify:

1. **Dashboard WeeklyCard** - uses `useLangPair()` - should work
2. **Dashboard QuickActions** - has ml/en strings directly - need to check
3. **Fund SectionHeading** - uses `useLangPair().primary()` - should work
4. **Fund PageHeader** - uses `useLangPair()` - should work
5. **Various fund components** - use `useLangPair()` or `useLang().t`

## Quick Test

To verify the issue, check if clicking the language toggle actually updates the `lang` state that all components read. The flow should be:

1. User clicks LangToggle button
2. `setLang(option.code)` called in LangContext
3. `setLangState(next)` updates React state
4. All components using `useLang()` or `useLangPair()` re-render with new `lang`
5. UI text switches based on `lang === "en" ? en : ml`

If step 3-4 doesn't happen, UI won't update.

## Potential Fix

If certain components aren't re-rendering, they may need to:
- Use `useLang()` hook instead of local state
- Ensure they're children of LanguageProvider
- Use `useEffect` with `lang` dependency to update local state