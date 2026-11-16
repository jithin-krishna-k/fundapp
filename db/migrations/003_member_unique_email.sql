-- One Member record per account email. Concurrent first page loads both call ensureMember; without this
-- they could each insert a Member for the same user.
CREATE UNIQUE INDEX IF NOT EXISTS app_records_member_email_uniq
  ON app_records ((lower(data->>'user_email')))
  WHERE entity = 'Member' AND data ? 'user_email';
