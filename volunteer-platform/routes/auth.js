const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

// Login route
router.post('/login', async (req, res) => {
  const { email, birthDate } = req.body;
  try {
    const user = await Registration.findOne({ email, birthDate: new Date(birthDate) });
    if (user) {
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
