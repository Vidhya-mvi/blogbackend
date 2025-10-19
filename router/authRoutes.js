const express = require("express");
const router = express.Router();
const {
  register,
  verifyOTP,
  login,
  logout,
  getCurrentUser,
} = require("../controllers/authController");
const {authMiddleware}= require("../middleware/authMiddleware");


router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/current-user", authMiddleware, getCurrentUser);
router.post("/logout", logout);

module.exports = router;
