import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({ name: { type: String, required: true }, mobile: { type: Number, required: true }, email: { type: String, required: true }, pass: { type: String, required: true } });

const userMong = mongoose.model('users',userSchema);

export default userMong;
