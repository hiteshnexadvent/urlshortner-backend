import mongoose from 'mongoose';

const qrSchema = new mongoose.Schema({
  url: String,
  qrImage: String,
  userEmail: { type: String, default: null },
  logoImage: { type: String, default: null }, // base64 or image URL
  color: { type: String, default: '#000000' }, // default black
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  },
}, { timestamps: true });

const qrMong = mongoose.model('qrscan', qrSchema);

export default qrMong;
