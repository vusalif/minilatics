const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('analytics.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS site_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_key TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_key TEXT NOT NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    visitor_hash TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_key) REFERENCES site_configs (site_key)
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_site_key ON analytics (site_key)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics (timestamp)`);
});

// Generate a simple hash for visitor identification (no IP, no cookies)
function generateVisitorHash(userAgent, referrer) {
  const crypto = require('crypto');
  const input = userAgent + (referrer || '');
  return crypto.createHash('md5').update(input).digest('hex').substring(0, 8);
}

// API endpoint to track page views
app.post('/track', (req, res) => {
  const { site_key, page_path, referrer } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  
  if (!site_key || !page_path) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate visitor hash
  const visitorHash = generateVisitorHash(userAgent, referrer);

  // Insert analytics data
  const stmt = db.prepare(`INSERT INTO analytics (site_key, page_path, referrer, visitor_hash) VALUES (?, ?, ?, ?)`);
  stmt.run([site_key, page_path, referrer || null, visitorHash], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to track data' });
    }
    res.json({ success: true });
  });
  stmt.finalize();
});

// API endpoint to get analytics data
app.get('/stats/:site_key', (req, res) => {
  const { site_key } = req.params;
  const { days = 30 } = req.query;

  if (!site_key) {
    return res.status(400).json({ error: 'Missing site key' });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get page views
  db.all(`SELECT COUNT(*) as views FROM analytics WHERE site_key = ? AND timestamp >= ?`, 
    [site_key, startDate.toISOString()], (err, viewsResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get unique visitors
    db.all(`SELECT COUNT(DISTINCT visitor_hash) as unique_visitors FROM analytics WHERE site_key = ? AND timestamp >= ?`, 
      [site_key, startDate.toISOString()], (err, visitorsResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get page paths
      db.all(`SELECT page_path, COUNT(*) as views FROM analytics WHERE site_key = ? AND timestamp >= ? GROUP BY page_path ORDER BY views DESC LIMIT 10`, 
        [site_key, startDate.toISOString()], (err, pagesResult) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Get referrers
        db.all(`SELECT referrer, COUNT(*) as visits FROM analytics WHERE site_key = ? AND timestamp >= ? AND referrer IS NOT NULL GROUP BY referrer ORDER BY visits DESC LIMIT 10`, 
          [site_key, startDate.toISOString()], (err, referrersResult) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            site_key,
            period_days: days,
            total_views: viewsResult[0].views,
            unique_visitors: visitorsResult[0].unique_visitors,
            top_pages: pagesResult,
            top_referrers: referrersResult
          });
        });
      });
    });
  });
});

// Serve the tracking script
app.get('/script.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(`
(function() {
  var script = document.currentScript;
  var siteKey = script.getAttribute('data-site-key');
  if (!siteKey) return;
  
  var pagePath = window.location.pathname + window.location.search;
  var referrer = document.referrer;
  var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  var host = '${req.get('host')}';
  
  fetch(protocol + '//' + host + '/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site_key: siteKey,
      page_path: pagePath,
      referrer: referrer
    })
  }).catch(function() {});
})();
  `);
});

// Serve admin page
app.get('/admin/:site_key', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Minilatics server running on port ${PORT}`);
  console.log(`Tracking script: http://localhost:${PORT}/script.js`);
});
