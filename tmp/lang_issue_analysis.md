# Language Toggle Issue Analysis

## User Complaint
"user select eng but it show malayalm with english,show english only if user select english hide malayalam"

## Current Implementation

### LangToggle.jsx (my edit)
```js
const optionsToShow = OPTIONS.filter((option) => option.code !== lang);
```
- When `lang = "en"` → shows only മലയാളം button
- When `lang = "ml"` → shows only EN button

### This correctly handles the toggle button options

## Problem
The LangToggle change only affects what's shown in the language toggle button itself. It does NOT automatically:
1. Switch all UI text from Malayalam to English when English is selected
2. Hide Malayalam content throughout the app

## How Language Switching Works in This App

1. **LangContext** maintains `lang` state (default "ml")
2. **LanguageProvider** loads preference from `app_user_prefs` on mount
3. **`t(ml, en)` function**: `lang === "en" ? en || ml : ml || en` - selects which text to show
4. **`useLangPair()`**: provides `primary`, `caption`, `leadFont`, `captionFont` based on `lang`
5. **Components use**: `{lang === "en" ? item.en : item.ml}` to switch text content

## Issue Location
When user clicks the language toggle:
- `setLang(option.code)` is called (from useLang context)
- This should update the context `lang` state
- But other components may not re-render with the new `lang` value, OR
- The preference might not be saving properly

## Required Fix
The LangToggle change I made is correct for the toggle button display. BUT the app needs additional changes to:
1. Ensure `setLang` properly updates context state
2. Ensure all UI components react to `lang` changes
3. Or add a proper language switcher that changes all UI text

## Quick Test
Check if clicking the toggle actually changes the `lang` state by verifying:
1. The onClick calls setLang correctly
2. The LanguageContext re-renders with new lang value
3. UI elements using `lang === "en" ? ... : ...` update accordingly