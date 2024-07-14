const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Registration = require('../models/Registration');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Register a volunteer
router.post('/register', upload.single('aadharUpload'), async (req, res) => {
  try {
    console.log('Received registration data:', req.body);
    console.log('Received file:', req.file);

    const newRegistration = new Registration({
      title: req.body.title,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      birthDate: req.body.birthDate,
      email: req.body.email,
      phone: req.body.phone,
      address: {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        zipCode: req.body.zipCode,
      },
      education: {
        college: req.body.college,
        field: req.body.field,
      },
      occupation: {
        company: req.body.company,
        position: req.body.position,
      },
      aadharNumber: req.body.aadharNumber,
      aadharUpload: req.file ? req.file.path : null,
      volunteerAreas: req.body.volunteerAreas,
      experience: req.body.experience,
      availableDays: req.body.availableDays,
      terms: req.body.terms === 'on',  // Convert "on" to true
    });
    const savedRegistration = await newRegistration.save();
    console.log('Registration saved:', savedRegistration);
    res.status(201).json(savedRegistration);
  } catch (error) {
    console.error('Error saving registration:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all registrations
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find();
    res.status(200).json(registrations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
