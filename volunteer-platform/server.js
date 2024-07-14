const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

const mongoURI = 'mongodb+srv://subbupendela0606:HKO5wwocdunLhbR1@cluster0.0con39q.mongodb.net/Registration?retryWrites=true&w=majority';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log('MongoDB connection error:', err));

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 60 * 1000 }, // Session expires after 30 minutes of inactivity
  store: MongoStore.create({
    mongoUrl: mongoURI,
    collectionName: 'sessions'
  })
}));

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});

const Contact = mongoose.model('Contact', contactSchema);

const userSchema = new mongoose.Schema({
  email: String,
  birthDate: String,
  phone: String,
  profilePic: String,
});

const User = mongoose.model('User', userSchema);

const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  venue: String,
  description: String,
  image: String,
  volunteers: [{
    email: String,
    birthDate: String,
    phone: String,
    profilePic: String,
  }]
});

const Event = mongoose.model('Event', eventSchema);

const registrationSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  message: String
});

const Registration = mongoose.model('Registration', registrationSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const adminUser = new User({ email: 'admin@example.com', birthDate: '2000-01-01', phone: '1234567890', profilePic: 'default.jpg' });

app.post('/auth/login', async (req, res) => {
  const { email, birthDate } = req.body;
  try {
    if (email === adminUser.email && birthDate === adminUser.birthDate) {
      req.session.user = adminUser;
      return res.status(200).json({ message: 'Admin login successful!' });
    }
    const user = await User.findOne({ email, birthDate });
    if (user) {
      req.session.user = user;
      return res.status(200).json({ message: 'Login successful!' });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

const authMiddleware = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).send('Unauthorized');
  }
};

app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

app.get('/api/current-user-registered-events', authMiddleware, async (req, res) => {
  try {
    const email = req.session.user.email;  // Fetching for logged in user
    const events = await Event.find({ 'volunteers.email': email });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registered events' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.find();
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

app.post('/api/create-event', authMiddleware, async (req, res) => {
  try {
    const { title, date, time, venue, description, image } = req.body;
    if (!title || !date || !time || !venue || !description || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const event = new Event({ title, date, time, venue, description, image });
    await event.save();
    res.status(200).json({ message: 'Event created successfully!' });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const { date, month, year } = req.query;
    let events;
    if (date) {
      events = await Event.find({ date });
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      events = await Event.find({ date: { $gte: startDate, $lte: endDate } });
    } else {
      events = await Event.find({});
    }
    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ message: 'Failed to fetch event details' });
  }
});

app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const result = await Event.findByIdAndDelete(eventId);
    if (!result) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully!' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

app.post('/api/register', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;
    const email = req.session.user.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(400).json({ message: 'Event not found' });
    }

    const newVolunteer = {
      email: user.email,
      birthDate: user.birthDate,
      phone: user.phone,
      profilePic: user.profilePic,
    };

    event.volunteers.push(newVolunteer);
    await event.save();

    res.status(200).json({ message: 'Successfully registered for the event!' });
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ message: 'Failed to register for event' });
  }
});

app.get('/api/current-user', authMiddleware, (req, res) => {
  res.json(req.session.user);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/eventCreation', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'eventCreation.html'));
});

app.get('/eventInfo', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'eventinfo.html'));
});

app.get('/eventDetails', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'eventdetails.html'));
});

app.get('/explore', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'explore.html'));
});

app.get('/dashboard', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  const open = await import('open');
  open.default(`http://localhost:${PORT}`);
});
