const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./router/authRoutes");
const blogRoutes = require("./router/blogRoutes");

const path = require("path");
const cors = require("cors");
dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());


app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,           
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"], 
  })
);

connectDB()

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/auth", authRoutes);
app.use("/api", blogRoutes);



app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
