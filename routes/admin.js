import express from 'express';
import {  adminForgetPass, adminLogin, adminLogout, adminSignup, countLinks, deleteUser, fetchUser, getadminForgetPass, getadminSignup, getchangePass, postchangePass, resendAdminOtp, resetAdminPassword, verifyAdminOtp } from '../controllers/adminAuthentication.js';
import { payment } from '../controllers/userAuthentication.js';
const router = express.Router();


router.get('/signup', getadminSignup);
router.post('/signUp', adminSignup);
router.post('/login', adminLogin);
// router.get('/adminDash', adminDash);
router.get('/change-password', getchangePass);
router.post('/change-password', postchangePass);
router.get('/manage-user', fetchUser);
router.get('/adminDash', countLinks);
router.get('/signout', adminLogout);
router.get('/delete-user/:id', deleteUser);

router.get('/forget-password', getadminForgetPass);
router.post('/forget-password', adminForgetPass);
router.post('/verify-otp', verifyAdminOtp);
router.post('/resend-otp', resendAdminOtp);
router.post('/reset-password', resetAdminPassword);


export default router;