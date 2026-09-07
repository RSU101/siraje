/**
 * Engineering Pro - Form Backend Server
 * Handles contact & service request forms from the website.
 * Run: npm start  (from this folder)  →  http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SUBMISSIONS_FILE)) {
  fs.writeFileSync(SUBMISSIONS_FILE, '[]', 'utf8');
}

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local/static hosting
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static website (optional - so one command serves everything)
const websiteRoot = path.join(__dirname, '..');
app.use(express.static(websiteRoot));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Engineering Pro Form API',
    time: new Date().toISOString()
  });
});

// Get all submissions (admin-style, simple)
app.get('/api/submissions', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    res.json({ success: true, count: data.length, submissions: data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not read submissions' });
  }
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, department, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Name, email and message are required'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: 'contact',
    name: String(name).trim().slice(0, 120),
    email: String(email).trim().toLowerCase(),
    department: department || 'general',
    message: String(message).trim().slice(0, 2000),
    receivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  };

  try {
    const list = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    list.unshift(entry);
    // Keep last 500
    if (list.length > 500) list.length = 500;
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf8');

    console.log(`[CONTACT] ${entry.name} <${entry.email}> — ${entry.department}`);
    res.json({
      success: true,
      message: 'Thank you! Your message has been received. We will respond within 24 hours.',
      id: entry.id
    });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, error: 'Server error saving submission' });
  }
});

// Service request form endpoint
app.post('/api/service', (req, res) => {
  const { company, contact, phone, serviceType, details } = req.body;

  if (!company || !contact || !phone || !details) {
    return res.status(400).json({
      success: false,
      error: 'Company, contact person, phone and details are required'
    });
  }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: 'service',
    company: String(company).trim().slice(0, 150),
    contact: String(contact).trim().slice(0, 120),
    phone: String(phone).trim().slice(0, 40),
    serviceType: serviceType || 'Other',
    details: String(details).trim().slice(0, 3000),
    receivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  };

  try {
    const list = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    list.unshift(entry);
    if (list.length > 500) list.length = 500;
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf8');

    console.log(`[SERVICE] ${entry.company} — ${entry.serviceType} (${entry.contact})`);
    res.json({
      success: true,
      message: 'Service request submitted successfully. Our team will contact you shortly.',
      id: entry.id
    });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ success: false, error: 'Server error saving request' });
  }
});

// Fallback for SPA-like routing (optional)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  // Let static middleware handle real files; only 404 unknowns
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`\n  ⚙️  Engineering Pro Backend running`);
  console.log(`  → API:    http://localhost:${PORT}/api/health`);
  console.log(`  → Website: http://localhost:${PORT}/`);
  console.log(`  → Submissions saved to: ${SUBMISSIONS_FILE}\n`);
});
