import express from 'express';
import { adminDash, adminLogin, adminLogout, adminSignup, getadminSignup, getchangePass, postchangePass } from '../controllers/adminAuthentication.js';
const router = express.Router();


router.get('/signup', getadminSignup);
router.post('/signUp', adminSignup);
router.post('/login', adminLogin);
router.get('/adminDash', adminDash);
router.get('/change-password', getchangePass);
router.post('/change-password', postchangePass);
router.get('/signout', adminLogout);





export default router;