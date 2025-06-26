import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: Number, required: true },
  email: { type: String, required: true },
  pass: { type: String, required: true },
  plan: {
    type: String,
    enum: ["Basic", "Advance", "Premium"],
    default: "Basic",
  },
  subscribedAt: Date,
  urlLogs: [{
    date: String, // e.g., "2025-06-25"
    count: { type: Number, default: 0 }
  }]
});

const userMong = mongoose.model("users", userSchema);

export default userMong;
