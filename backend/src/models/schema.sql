-- Users (business owners)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(20) UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  full_name   VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses owned by users
CREATE TABLE IF NOT EXISTS businesses (
  id         SERIAL PRIMARY KEY,
  owner_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP codes for phone verification
CREATE TABLE IF NOT EXISTS otp_codes (
  id          SERIAL PRIMARY KEY,
  phone       VARCHAR(20) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (people who owe the user)
CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  full_name   VARCHAR(100) NOT NULL,
  phone       VARCHAR(20),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  client_id    INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  amount       NUMERIC(14, 2) NOT NULL,
  currency     VARCHAR(5) DEFAULT 'TJS',
  description  TEXT,
  due_date     DATE,
  type         VARCHAR(20) DEFAULT 'receivable', -- receivable | payable
  status       VARCHAR(20) DEFAULT 'active',    -- active | paid | overdue
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations (safe: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
ALTER TABLE users    ADD COLUMN IF NOT EXISTS email      VARCHAR(255) UNIQUE;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS google_id  VARCHAR(255) UNIQUE;
ALTER TABLE debts    ADD COLUMN IF NOT EXISTS type        VARCHAR(20) DEFAULT 'receivable';
ALTER TABLE debts    ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

-- Multi-business support
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id);
ALTER TABLE debts   ADD COLUMN IF NOT EXISTS business_id INTEGER REFERENCES businesses(id);

-- Backfill: create a default business for every user who doesn't have one yet
INSERT INTO businesses (owner_id, name)
SELECT u.id, COALESCE(NULLIF(TRIM(u.full_name), ''), 'Мой бизнес')
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM businesses b WHERE b.owner_id = u.id);

-- Backfill: assign business_id to existing clients
UPDATE clients SET business_id = (
  SELECT b.id FROM businesses b WHERE b.owner_id = clients.user_id ORDER BY b.created_at LIMIT 1
) WHERE business_id IS NULL;

-- Backfill: assign business_id to existing debts
UPDATE debts SET business_id = (
  SELECT b.id FROM businesses b WHERE b.owner_id = debts.user_id ORDER BY b.created_at LIMIT 1
) WHERE business_id IS NULL;

-- Repayments
CREATE TABLE IF NOT EXISTS repayments (
  id         SERIAL PRIMARY KEY,
  debt_id    INTEGER REFERENCES debts(id) ON DELETE CASCADE,
  amount     NUMERIC(14, 2) NOT NULL,
  note       TEXT,
  paid_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Employee access
CREATE TABLE IF NOT EXISTS business_members (
  id          SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone       VARCHAR(20),
  role        VARCHAR(20) DEFAULT 'employee',
  invited_by  INTEGER REFERENCES users(id),
  status      VARCHAR(20) DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);
-- Add phone column to existing installations
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Installment / Nasiya
ALTER TABLE debts ADD COLUMN IF NOT EXISTS kind VARCHAR(20) DEFAULT 'standard';

CREATE TABLE IF NOT EXISTS debt_schedules (
  id          SERIAL PRIMARY KEY,
  debt_id     INTEGER REFERENCES debts(id) ON DELETE CASCADE,
  part_number INTEGER NOT NULL,
  amount      NUMERIC(14, 2) NOT NULL,
  due_date    DATE NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending',
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_debts_user_id         ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_client_id       ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_repayments_debt       ON repayments(debt_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone             ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_biz  ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_debt_schedules_debt   ON debt_schedules(debt_id);
-- Prevent duplicate phone invites for unregistered users within the same business
CREATE UNIQUE INDEX IF NOT EXISTS idx_bm_business_phone
  ON business_members(business_id, phone) WHERE user_id IS NULL;
