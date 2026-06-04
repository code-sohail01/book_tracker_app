require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Confirm JSON body parsing for API requests (login/register payloads)
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/api/auth')) {
    console.log(`[${req.method}] ${req.path} body keys:`, req.body ? Object.keys(req.body) : '(empty)');
  }
  next();
});

// Connect to Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// Hook up the routes
app.use('/api', apiRoutes);

// Bind to 0.0.0.0 for external/USB device access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});