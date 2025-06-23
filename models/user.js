const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String,
       required: true, 
       trim: true 
      },
    email: {
       type: String, 
       required: true, 
       unique: true, 
        trim: true },
    password: { 
      type: String,
       required: true
       },
    role: { type: String, 
      enum: ["user", "admin"],
       default: "user" },
    isVerified: { type: Boolean,
       default: false },
   
  },
  { timestamps: true }
);


userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
