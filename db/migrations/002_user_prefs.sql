-- Per-user UI preferences (language), stored in Neon instead of browser storage.
CREATE TABLE IF NOT EXISTS app_user_prefs (
  user_id      text PRIMARY KEY,
  lang         text NOT NULL DEFAULT 'ml' CHECK (lang IN ('ml', 'en')),
  updated_date timestamptz NOT NULL DEFAULT now()
);
