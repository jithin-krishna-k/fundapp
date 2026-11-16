-- App data, stored the way the Base44 entity API models it: one JSON document per record.
CREATE TABLE IF NOT EXISTS app_records (
  id           text PRIMARY KEY,
  entity       text NOT NULL,
  data         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by   text,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_records_entity_idx ON app_records (entity);
CREATE INDEX IF NOT EXISTS app_records_data_idx ON app_records USING gin (data jsonb_path_ops);

-- Private uploads (receipts, proofs). Served only through short-lived signed links.
CREATE TABLE IF NOT EXISTS app_files (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  content_type text NOT NULL,
  size         integer NOT NULL,
  owner_id     text NOT NULL,
  bytes        bytea NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now()
);

-- Members invited by email before they sign up.
CREATE TABLE IF NOT EXISTS app_invites (
  email        text PRIMARY KEY,
  role         text NOT NULL DEFAULT 'user',
  invited_by   text,
  created_date timestamptz NOT NULL DEFAULT now()
);
