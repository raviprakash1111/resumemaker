const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
// Security filter to block public downloads of raw DB and config files
app.use((req, res, next) => {
  const blockedExtensions = ['.sqlite', '.json', '.yml', '.md'];
  const blockedFiles = ['server.js', 'package.json', 'package-lock.json'];
  const ext = path.extname(req.path).toLowerCase();
  const file = path.basename(req.path).toLowerCase();

  if (blockedExtensions.includes(ext) || blockedFiles.includes(file) || req.path.includes('/.git')) {
    return res.status(403).json({ error: 'Access denied: Sensitive file' });
  }
  next();
});

app.use(express.static(__dirname));

// Initialize SQLite DB
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to SQLite local database.');
    db.serialize(() => {
      // Create Resumes table
      db.run(`
        CREATE TABLE IF NOT EXISTS resumes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          title TEXT,
          email TEXT,
          phone TEXT,
          location TEXT,
          linkedin TEXT,
          portfolio TEXT,
          summary TEXT,
          skills TEXT,
          experience TEXT,
          achievements TEXT,
          education TEXT,
          cover_letter TEXT,
          ats_score INTEGER,
          template TEXT,
          tone TEXT,
          industry TEXT,
          exp_level TEXT,
          target_role TEXT,
          company TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Verify and run migrations for missing columns in resumes table (for existing databases)
      const addColumnIfNeeded = (column, type) => {
        db.all(`PRAGMA table_info(resumes)`, [], (pragmaErr, columns) => {
          if (pragmaErr) {
            console.error('Pragma check error:', pragmaErr.message);
            return;
          }
          if (columns && columns.length > 0) {
            const exists = columns.some(col => col.name === column);
            if (!exists) {
              db.run(`ALTER TABLE resumes ADD COLUMN ${column} ${type}`, (alterErr) => {
                if (alterErr) {
                  console.error(`Failed to add column ${column} to resumes:`, alterErr.message);
                } else {
                  console.log(`Migration: Added column ${column} to resumes table.`);
                }
              });
            }
          }
        });
      };

      addColumnIfNeeded('industry', 'TEXT');
      addColumnIfNeeded('exp_level', 'TEXT');
      addColumnIfNeeded('target_role', 'TEXT');
      addColumnIfNeeded('company', 'TEXT');

      // Create Interviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS interviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT,
          role TEXT,
          company TEXT,
          avg_score INTEGER,
          time_spent TEXT,
          completion TEXT,
          questions_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Database tables verified/created successfully.');
    });
  }
});

// ─── API ROUTES ──────────────────────────────────────────────

// Resumes Endpoints
app.post('/api/resumes', (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO resumes (
      name, title, email, phone, location, linkedin, portfolio,
      summary, skills, experience, achievements, education, cover_letter,
      ats_score, template, tone, industry, exp_level, target_role, company
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    data.personal?.name || '',
    data.personal?.title || '',
    data.personal?.email || '',
    data.personal?.phone || '',
    data.personal?.location || '',
    data.personal?.linkedin || '',
    data.personal?.portfolio || '',
    data.summary || '',
    JSON.stringify(data.skills || []),
    JSON.stringify(data.experiences || []),
    JSON.stringify(data.achievements || []),
    JSON.stringify(data.education || []),
    JSON.stringify(data.coverLetter || null),
    data.atsData?.score || 0,
    data.template || 'modern',
    data.tone || 'professional',
    data.industry || 'tech',
    data.expLevel || 'mid',
    data.targetRole || '',
    data.company || ''
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save resume' });
    }
    res.json({ id: this.lastID, message: 'Resume saved successfully' });
  });
});

app.get('/api/resumes', (req, res) => {
  db.all(
    'SELECT id, name, title, ats_score, template, tone, industry, exp_level, target_role, company, created_at FROM resumes ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch resumes' });
      }
      res.json(rows);
    }
  );
});

app.get('/api/resumes/:id', (req, res) => {
  db.get('SELECT * FROM resumes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch resume' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Safely parse JSON fields back to objects/arrays
    const safeJsonParse = (str, fallback) => {
      if (!str || str === 'null') return fallback;
      try { return JSON.parse(str); } catch { return fallback; }
    };

    row.skills        = safeJsonParse(row.skills, []);
    row.experiences   = safeJsonParse(row.experience, []);
    row.achievements  = safeJsonParse(row.achievements, []);
    row.education     = safeJsonParse(row.education, []);
    row.coverLetter   = safeJsonParse(row.cover_letter, null);

    res.json(row);
  });
});

app.delete('/api/resumes/:id', (req, res) => {
  db.run('DELETE FROM resumes WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete resume' });
    }
    res.json({ message: 'Resume deleted successfully' });
  });
});

// Interviews Endpoints
app.post('/api/interviews', (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO interviews (
      type, role, company, avg_score, time_spent, completion, questions_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    data.type || '',
    data.role || '',
    data.company || '',
    data.avg_score || 0,
    data.time_spent || '00:00',
    data.completion || '100%',
    JSON.stringify(data.questions_data || [])
  ];

  db.run(query, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save interview' });
    }
    res.json({ id: this.lastID, message: 'Interview scorecard saved' });
  });
});

app.get('/api/interviews', (req, res) => {
  db.all('SELECT id, type, role, company, avg_score, time_spent, completion, created_at FROM interviews ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch interviews' });
    }
    res.json(rows);
  });
});

app.get('/api/interviews/:id', (req, res) => {
  db.get('SELECT * FROM interviews WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch interview details' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Interview scorecard not found' });
    }

    // Safely parse question data
    if (row.questions_data) {
      try {
        row.questions_data = JSON.parse(row.questions_data);
      } catch (e) {
        console.error('JSON parsing failed for interview questions:', e);
        row.questions_data = [];
      }
    } else {
      row.questions_data = [];
    }

    res.json(row);
  });
});

app.delete('/api/interviews/:id', (req, res) => {
  db.run('DELETE FROM interviews WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete interview' });
    }
    res.json({ message: 'Interview deleted' });
  });
});

// Fallback: serve index.html for any non-API route (client-side routing)
app.get(/^(?!\/api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
