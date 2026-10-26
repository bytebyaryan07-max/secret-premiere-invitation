-- Visitors who entered their name to unlock the invitation.
-- The same person may visit many times, so names are intentionally not unique.
CREATE TABLE IF NOT EXISTS visitors (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL CHECK (length(btrim(name)) > 0),
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent  VARCHAR(512),
  ip_address  VARCHAR(45)
);

-- Each time a visitor saves/downloads their invitation card.
CREATE TABLE IF NOT EXISTS invitation_saves (
  id          SERIAL PRIMARY KEY,
  visitor_id  INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recent visitors and daily statistics
CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON visitors (visited_at DESC);
-- Case-insensitive name lookups and unique guest counts
CREATE INDEX IF NOT EXISTS idx_visitors_name_lower ON visitors (lower(name));
-- Joining saves to visitors
CREATE INDEX IF NOT EXISTS idx_invitation_saves_visitor_id ON invitation_saves (visitor_id);
-- Daily save statistics
CREATE INDEX IF NOT EXISTS idx_invitation_saves_saved_at ON invitation_saves (saved_at DESC);
