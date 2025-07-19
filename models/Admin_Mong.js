import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  pass: { type: String, required: true },
  mobile: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  role: {
    type: String,
    default: "admin",
  },
});

const adminMong = mongoose.model("admins", adminSchema);

export default adminMong;
