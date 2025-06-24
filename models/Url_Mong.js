import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
  userEmail: { type: String, default: null },
  expiresAt: {
    type: Date,
    default: undefined,
    index: { expires: 0 } // TTL index: MongoDB auto-deletes after this date
  }
}, { timestamps: true });

const urlMong = mongoose.model('links', urlSchema);
export default urlMong;
