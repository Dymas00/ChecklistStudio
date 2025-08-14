import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('./database.sqlite');

// Create tables if they don't exist
const createTables = () => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      cpf TEXT,
      contractor TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      icon TEXT NOT NULL,
      sections TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY,
      checklist_number TEXT NOT NULL UNIQUE,
      template_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      analyst_id TEXT,
      store_code TEXT NOT NULL,
      store_manager TEXT NOT NULL,
      store_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      responses TEXT NOT NULL,
      photos TEXT,
      signature TEXT,
      validation_code TEXT,
      rating INTEGER,
      feedback TEXT,
      approval_comment TEXT,
      approved_by TEXT,
      approved_at INTEGER,
      client_ip TEXT,
      user_agent TEXT,
      geo_location TEXT,
      device_info TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES templates(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      FOREIGN KEY (analyst_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_sequence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      last_number INTEGER NOT NULL DEFAULT 0,
      year INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};

createTables();
export const db = drizzle(sqlite, { schema });
