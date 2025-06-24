import mongoose from 'mongoose';

const qrSchema = new mongoose.Schema({
    url: String,
    qrImage: String,
    userEmail: { type: String, default: null },
   expiresAt: {
    type: Date,
    index: { expires: 0 } // 🔥 TTL index so MongoDB auto-deletes after "expiresAt"
  } 
}, { timestamps: true });


const qrMong = mongoose.model('qrscan', qrSchema);

export default qrMong;

