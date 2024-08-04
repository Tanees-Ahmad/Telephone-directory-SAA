const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tel_directory', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Define schemas and models
const directorySchema = new mongoose.Schema({
  name: String,
  phone: String,
  department: String
});

const Directory = mongoose.model('Directory', directorySchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: Boolean
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));

// Multer setup for file upload
const upload = multer({ dest: 'uploads/' });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user = user;
    res.redirect('/admin');
  } else {
    res.send('Invalid credentials');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.sendStatus(403); // Forbidden
  }
}

app.get('/api/records', async (req, res) => {
  const records = await Directory.find();
  res.json(records);
});

app.post('/api/records', isAdmin, async (req, res) => {
  const newRecord = new Directory({ name: req.body.name, phone: req.body.phone, department: req.body.department });
  await newRecord.save();
  res.redirect('/admin');
});

app.put('/api/records/:id', isAdmin, async (req, res) => {
  await Directory.findByIdAndUpdate(req.params.id, { name: req.body.name, phone: req.body.phone, department: req.body.department });
  res.sendStatus(200);
});

app.delete('/api/records/:id', isAdmin, async (req, res) => {
  await Directory.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

app.post('/upload', isAdmin, upload.single('pdf'), async (req, res) => {
  const dataBuffer = fs.readFileSync(req.file.path);
  const pdfData = await pdfParse(dataBuffer);

  const lines = pdfData.text.split('\n');
  for (const line of lines) {
    const [name, phone, department] = line.split(',');
    if (name && phone && department) {
      const newRecord = new Directory({ name, phone, department });
      await newRecord.save();
    }
  }

  fs.unlinkSync(req.file.path); // Remove file after processing
  res.redirect('/admin');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
