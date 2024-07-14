const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

// Get all registrations (for admin)
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find();
    res.status(200).json(registrations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
