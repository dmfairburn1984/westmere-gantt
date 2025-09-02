const express = require('express');
const path = require('path');  // Only declared ONCE at the top
const basicAuth = require('express-basic-auth');
const fs = require('fs');  // Add this for file reading

const app = express();
const PORT = process.env.PORT || 3000;

// Read credentials from environment variables
const BASIC_USER = process.env.BASIC_USER || 'westmere';
const BASIC_PASS = process.env.BASIC_PASS || 'sfc-vietnam-2025';

// Apply Basic Auth BEFORE serving static files
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

// API endpoint to get tasks - FIXED VERSION
app.get('/api/tasks', (req, res) => {
  try {
    const tasksPath = path.join(__dirname, 'tasks.json');
    console.log('Reading tasks from:', tasksPath);
    const tasksData = fs.readFileSync(tasksPath, 'utf8');
    const tasks = JSON.parse(tasksData);
    res.json(tasks);
  } catch (error) {
    console.error('Error loading tasks:', error);
    res.status(500).json({ error: 'Failed to load tasks', details: error.message });
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