import express from 'express';
import {  adminLogin, adminLogout, adminSignup, countLinks, deleteUser, fetchUser, getadminSignup, getchangePass, postchangePass } from '../controllers/adminAuthentication.js';
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





export default router;