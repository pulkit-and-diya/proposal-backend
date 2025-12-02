const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new Database('database.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE,
    game1_completed INTEGER DEFAULT 0,
    game2_completed INTEGER DEFAULT 0,
    proposal_answered INTEGER DEFAULT 0,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Get or create session
app.post('/api/session', (req, res) => {
  const { sessionId } = req.body;
  
  let session = db.prepare('SELECT * FROM progress WHERE session_id = ?').get(sessionId);
  
  if (!session) {
    const insert = db.prepare('INSERT INTO progress (session_id) VALUES (?)');
    insert.run(sessionId);
    session = db.prepare('SELECT * FROM progress WHERE session_id = ?').get(sessionId);
  }
  
  res.json(session);
});

// Update game progress
app.post('/api/update-progress', (req, res) => {
  const { sessionId, game1, game2, answer } = req.body;
  
  const update = db.prepare(`
    UPDATE progress 
    SET game1_completed = ?, 
        game2_completed = ?, 
        proposal_answered = ?,
        answer = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `);
  
  update.run(
    game1 ? 1 : 0,
    game2 ? 1 : 0,
    answer ? 1 : 0,
    answer || null,
    sessionId
  );
  
  const session = db.prepare('SELECT * FROM progress WHERE session_id = ?').get(sessionId);
  res.json(session);
});

// Get all sessions (for you to check)
app.get('/api/admin/sessions', (req, res) => {
  const sessions = db.prepare('SELECT * FROM progress ORDER BY created_at DESC').all();
  res.json(sessions);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
