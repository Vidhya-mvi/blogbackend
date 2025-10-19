const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./router/authRoutes");
const blogRoutes = require("./router/blogRoutes");

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();


app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "https://blog-frontend-snowy.vercel.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);




connectDB()

app.use("/api/auth", authRoutes);
app.use("/api", blogRoutes);


app.get("/", (req, res) => res.send("Blog API is running..."));


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
