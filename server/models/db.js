const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Get database path from environment variable or use default
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

// Create a new database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
  initializeDatabase();
});

// Enable foreign key constraints
const enableForeignKeys = () => {
  return new Promise((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Create tables
const createTables = async () => {
  try {
    await enableForeignKeys();
    
    // Create Users table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'personnel')) NOT NULL,
        email TEXT UNIQUE,
        fullName TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Equipment table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS Equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT,
        serialNumber TEXT UNIQUE,
        location TEXT,
        lastServiced DATETIME,
        serviceIntervalDays INTEGER DEFAULT 30,
        status TEXT DEFAULT 'operational',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Tasks table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'overdue')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        assignedTo INTEGER,
        assignedBy INTEGER,
        equipmentId INTEGER,
        benchmarkTime DATETIME,
        actualTime DATETIME,
        colorStatus TEXT DEFAULT 'green' CHECK(colorStatus IN ('red', 'yellow', 'green')),
        photoPath TEXT,
        remarks TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignedTo) REFERENCES Users(id) ON DELETE SET NULL,
        FOREIGN KEY (assignedBy) REFERENCES Users(id) ON DELETE SET NULL,
        FOREIGN KEY (equipmentId) REFERENCES Equipment(id) ON DELETE SET NULL
      )
    `);

    // Create Logs table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS Logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER NOT NULL,
        userId INTEGER,
        action TEXT NOT NULL,
        description TEXT,
        oldValue TEXT,
        newValue TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
      )
    `);

    // Create ServiceHistory table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS ServiceHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipmentId INTEGER NOT NULL,
        serviceDate DATETIME NOT NULL,
        serviceType TEXT NOT NULL,
        description TEXT,
        technicianId INTEGER,
        nextServiceDate DATETIME,
        cost REAL,
        invoiceNumber TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipmentId) REFERENCES Equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (technicianId) REFERENCES Users(id) ON DELETE SET NULL
      )
    `);

    console.log('Database tables created successfully');
    await createDefaultAdmin();
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await getQuery('SELECT id FROM Users WHERE username = ?', ['admin']);
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await runQuery(
        'INSERT INTO Users (username, password, role, email, fullName) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin', 'admin@example.com', 'System Administrator']
      );
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Initialize the database
const initializeDatabase = () => {
  db.serialize(async () => {
    try {
      await createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  });
};

// Helper function to run SQL queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper function to get a single row
const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper function to get multiple rows
const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Handle database connection errors
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'SQLITE_CANTOPEN') {
    console.error('Cannot open database. Please check if the database file is accessible.');
  }
});

// Close the database connection when the Node process ends
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
};