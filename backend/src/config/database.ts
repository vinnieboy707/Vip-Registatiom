import sqlite3 from 'sqlite3';
import { config } from '../config/config';
import logger from '../config/logger';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(config.database.path);
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Error opening database:', err);
  } else {
    logger.info(`Database connected: ${dbPath}`);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'agent',
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vin TEXT UNIQUE NOT NULL,
        license_plate TEXT,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        color TEXT,
        current_owner_name TEXT,
        current_owner_address TEXT,
        registration_status TEXT DEFAULT 'inactive',
        registration_expiry DATE,
        is_stolen BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Registration records table
    db.run(`
      CREATE TABLE IF NOT EXISTS registration_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        agent_id INTEGER,
        registration_type TEXT NOT NULL,
        registration_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        base_fee DECIMAL(10,2),
        transfer_fee DECIMAL(10,2),
        total_fee DECIMAL(10,2),
        payment_status TEXT DEFAULT 'pending',
        location_filed TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (agent_id) REFERENCES users(id)
      )
    `);

    // Title transfers table
    db.run(`
      CREATE TABLE IF NOT EXISTS title_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        transfer_type TEXT NOT NULL,
        from_owner TEXT NOT NULL,
        to_owner TEXT NOT NULL,
        from_state TEXT,
        to_state TEXT,
        transfer_date DATE NOT NULL,
        transfer_fee DECIMAL(10,2),
        is_family_transfer BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'pending',
        agent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (agent_id) REFERENCES users(id)
      )
    `);

    // Ownership history table
    db.run(`
      CREATE TABLE IF NOT EXISTS ownership_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        owner_name TEXT NOT NULL,
        owner_address TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      )
    `);

    // Fees table
    db.run(`
      CREATE TABLE IF NOT EXISTS fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fee_type TEXT UNIQUE NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit log table for security
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default fee structure
    const defaultFees = [
      ['registration_new', 'New vehicle registration', 150.00],
      ['registration_renewal', 'Registration renewal', 75.00],
      ['title_transfer_standard', 'Standard title transfer', 95.00],
      ['title_transfer_out_of_state', 'Out-of-state title transfer', 125.00],
      ['title_transfer_family', 'Family member transfer', 25.00],
      ['duplicate_title', 'Duplicate title', 50.00],
      ['plate_replacement', 'License plate replacement', 30.00],
    ];

    const insertFee = db.prepare(`
      INSERT OR IGNORE INTO fees (fee_type, description, amount) 
      VALUES (?, ?, ?)
    `);

    defaultFees.forEach(fee => {
      insertFee.run(fee);
    });

    insertFee.finalize();

    logger.info('Database initialized successfully');
  });
}

export default db;
