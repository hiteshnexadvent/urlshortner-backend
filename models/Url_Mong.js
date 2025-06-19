import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
  userEmail: { type: String, default: null }
}, { timestamps: true });

const urlMong = mongoose.model('links', urlSchema);
export default urlMong;
