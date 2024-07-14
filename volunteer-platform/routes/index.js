const express = require('express');
const path = require('path');
const router = express.Router();

// Serve landing page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// Serve registration page
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/registrationpage.html'));
});

// Serve admin page
router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

module.exports = router;
