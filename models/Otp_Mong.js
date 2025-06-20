import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes = 300 seconds, Mongo will auto-delete after expiry
  }
});

const OtpModel = mongoose.model('OtpModel', otpSchema);

export default OtpModel;
