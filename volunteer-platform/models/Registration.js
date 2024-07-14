const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  title: String,
  firstName: String,
  lastName: String,
  birthDate: Date,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  education: {
    college: String,
    field: String,
  },
  occupation: {
    company: String,
    position: String,
  },
  aadharNumber: String,
  aadharUpload: String,
  volunteerAreas: String,
  experience: String,
  availableDays: [String],
  terms: Boolean,
});

const Registration = mongoose.model('Registration', RegistrationSchema);

module.exports = Registration;
