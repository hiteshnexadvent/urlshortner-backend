import mongoose from 'mongoose';

const guestTrackerSchema = new mongoose.Schema({
  ip: String,
  date: String,
  count: {
    type: Number,
    default: 1
  }
});

const guestMong = mongoose.model('Guest',guestTrackerSchema );

export default guestMong;


