const User = require("../models/user");
const OTP = require("../models/otp");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('Generated OTP:', otp); 
  return otp;
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// register
const register = async (req, res) => {
  let { username, email, password, role } = req.body;

  try {
    console.log("Register attempt:", { username, email, role });
    
    email = email.toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", existingUser);
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("Password provided:", password);
    if (!passwordRegex.test(password)) {
      console.log("Password validation failed for:", email);
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: email === process.env.ADMIN_EMAIL ? "admin" : "user",
      isVerified: false,
    });

    await newUser.save();

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); 
    console.log("OTP expires at:", otpExpires);

    await OTP.findOneAndUpdate(
      { userId: newUser._id },
      { otp, expiresAt: otpExpires },
      { upsert: true, new: true }
    );

    try {
      await transporter.sendMail({
        from: `Blog App <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Verification OTP",
        html: `<h3>Your OTP Code:</h3><h1>${otp}</h1><p>It expires in 5 minutes.</p>`,
      });
      console.log("OTP sent to email:", otp);
    } catch (err) {
      console.error("Error sending OTP email:", err.message);
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    res.status(201).json({
      message: "User created! OTP sent to your email.",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

//  VERIFY OTP 
const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP are required" });
    }

    const otpRecord = await OTP.findOne({ userId });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteMany({ userId });

    res.status(200).json({ message: "User verified successfully. You can now log in." });
  } catch (err) {
    console.error("Error verifying OTP:", err.message);
    res.status(500).json({ message: "Internal server error. Please try again." });
  }
};

// login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt:", { email });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first" });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({
        message: "Login successful",
        user: { id: user._id, username: user.username, role: user.role },
        token, 
      });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};


const getCurrentUser = (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      console.log("No token found in cookies.");
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded user from token:", decoded);
    res.json({ user: decoded });
  } catch (err) {
    console.error("Invalid token error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

//  LOGOUT 
const logout = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
};



module.exports = { register, verifyOTP, login, logout, getCurrentUser };
