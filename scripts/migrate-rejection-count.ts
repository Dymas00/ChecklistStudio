#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { checklists } from '../shared/schema.js';
import { eq, isNull, sql } from 'drizzle-orm';

// Connect to database
const sqlite = new Database('database.db');
const db = drizzle(sqlite);

async function migrateRejectionCount() {
  console.log('Starting migration: Adding rejectionCount field...');
  
  try {
    // First, check if the column already exists
    const tableInfo = sqlite.prepare("PRAGMA table_info(checklists)").all();
    const columnExists = tableInfo.some((col: any) => col.name === 'rejection_count');
    
    if (!columnExists) {
      console.log('Adding rejection_count column...');
      sqlite.exec('ALTER TABLE checklists ADD COLUMN rejection_count INTEGER DEFAULT 0');
      console.log('✅ Column added successfully');
    } else {
      console.log('Column already exists, updating NULL values...');
      
      // Update any NULL values to 0
      sqlite.exec('UPDATE checklists SET rejection_count = 0 WHERE rejection_count IS NULL');
      console.log('✅ NULL values updated to 0');
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

migrateRejectionCount();