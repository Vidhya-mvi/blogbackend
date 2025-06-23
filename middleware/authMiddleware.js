const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    console.log(" Authenticated User:", req.user);

    next();
  } catch (err) {
    console.error(" Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  console.log(" Admin access granted");
  next();
};

module.exports = { authMiddleware, isAdmin };
