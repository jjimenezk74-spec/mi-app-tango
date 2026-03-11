
CREATE TABLE local_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'cashier',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_local_users_username ON local_users(username);

-- Insert default admin user (password: admin123)
INSERT INTO local_users (username, password_hash, name, role) 
VALUES ('admin', 'admin123', 'Administrador', 'admin');
