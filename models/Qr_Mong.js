import mongoose from 'mongoose';

const qrSchema = new mongoose.Schema({
    url: String,
    qrImage: String,
    userEmail: { type: String, default: null },
    expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
    index: { expires: 0 }, // TTL index (Mongo will auto-delete)
  }
}, { timestamps: true });


const qrMong = mongoose.model('qrscan', qrSchema);

export default qrMong;

