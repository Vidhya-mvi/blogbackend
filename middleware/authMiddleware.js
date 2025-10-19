const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        console.log("Authenticated User ID:", req.user.id);

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.error(" Token verification failed: Token has expired.", err.message);
            return res.status(401).json({ message: "Token has expired" });
        } else {
            console.error(" Token verification failed: Invalid signature or format.", err.message);
            return res.status(401).json({ message: "Invalid token" });
        }
    }
};

const isAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    next();
};

module.exports = { authMiddleware, isAdmin };