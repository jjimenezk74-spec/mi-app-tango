
CREATE TABLE cash_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  opening_amount INTEGER NOT NULL,
  closing_amount INTEGER,
  expected_amount INTEGER,
  difference INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cash_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  sale_id INTEGER,
  user_id INTEGER,
  user_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX idx_cash_sessions_opened_at ON cash_sessions(opened_at);
CREATE INDEX idx_cash_movements_session ON cash_movements(session_id);
