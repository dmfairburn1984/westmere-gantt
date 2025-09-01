const express = require('express');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Read credentials from environment variables
// Default credentials for Westmere/SFC
const BASIC_USER = process.env.BASIC_USER || 'westmere';
const BASIC_PASS = process.env.BASIC_PASS || 'sfc-vietnam-2025';

// Apply Basic Auth BEFORE serving static files.
app.use(
  basicAuth({
    users: { [BASIC_USER]: BASIC_PASS },
    challenge: true,
    realm: 'Westmere Factory Development Dashboard',
    unauthorizedResponse: () => 'Authentication required.'
  })
);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = require('./tasks.json');
    res.json(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    project: 'Westmere Factory Development',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`Westmere Dashboard running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});