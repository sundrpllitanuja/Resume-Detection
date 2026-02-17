require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pdf = require("pdf-parse"); 
const multer = require("multer");

const User = require("./models/User");
const Resume = require("./models/Resume");

const app = express();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 2. STATIC FILES - Serves everything in the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// 3. DATABASE
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sundrpllitanuja231006_db_user:hBZo2hR4WaA9E6hB@cluster0.gbyauu1.mongodb.net/')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ================= AUTH MIDDLEWARE =================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });

  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// ================= AUTH ROUTES =================
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role: role || "user" });
    await newUser.save();
    
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });
    res.status(201).json({ message: "Signup successful", token, user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await User.findOne({ email });
    if (!foundUser) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: foundUser._id, role: foundUser.role }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });
    res.json({ message: "Login successful", token, user: foundUser });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= RESUME ROUTES =================
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload_resume", authenticateToken, upload.single("resumeFile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please upload a PDF file" });

    const data = await pdf(req.file.buffer);
    const resumeText = data.text;
    const fraudScore = Math.floor(Math.random() * 100);
    const flags = fraudScore > 70 ? ["Suspicious experience", "Unverified certifications"] : [];

    const newResume = new Resume({
      fileName: req.file.originalname,
      resumeText,
      fraudScore,
      flags,
      userId: req.user.id
    });

    await newResume.save();
    res.status(201).json({ message: "PDF analyzed successfully", resume: newResume });
  } catch (err) {
    res.status(500).json({ message: "Error processing PDF" });
  }
});

app.get("/my_resumes", authenticateToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));