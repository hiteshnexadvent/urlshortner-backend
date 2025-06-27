import axios from 'axios';
import userMong from '../models/User_Mong.js';
import qrMong from '../models/Qr_Mong.js';
import bcrypt from 'bcrypt';
import qrcode from 'qrcode';
import { validationResult } from 'express-validator';
import sendMail from '../utils/sendMailOtp.js';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';


import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// ------------------------ user register

export const registerUser = async (req, res) => {
    
  const { name, email, mobile, pass } = req.body;
  
  const error = validationResult(req);

  if (!error.isEmpty()) {

      console.log('Validation Error:', error.array());
      return res.status(400).json({ message: error.array()[0].msg });
        
      }

    try {

        const existingUser = await userMong.findOne({ email });
        
        const hashedPass = await bcrypt.hash(pass, 10);

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
        
        const newUser = new userMong({
            name, email, mobile, pass: hashedPass
        })

        await newUser.save();
        return res.status(201).json({ message: 'User registered' });
        

    }
    catch (err) {
        return res.status(500).json({ message: 'Server Error' });        
    }

}

// ---------------------------- login user

export const loginUser=async (req,res) => {
    
    try {
        
      const { email, pass } = req.body;
      
  //       if (!captcha) return res.status(400).json({ message: "reCAPTCHA required" });

  // // Verify with Google
  // const secret = process.env.RECAPTCHA_SECRET_KEY;
  // const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captcha}`;
      
  // const { data } = await axios.post(verifyURL);
  
  // if (!data.success) return res.status(400).json({ message: "Failed reCAPTCHA verification" });


    const userr = await userMong.findOne({ email });

    if (!userr) {
      return res.status(404).json({ message: 'User not exists' });       
    }

        // Check if account is temporarily blocked
    if (userr.loginBlockedUntil && userr.loginBlockedUntil > new Date()) {
      const minutesLeft = Math.ceil((userr.loginBlockedUntil - new Date()) / (60 * 1000));
      return res.status(403).json({ message: `Account temporarily locked. Try again in ${minutesLeft} minutes.` });
    }

    const matchPass = await bcrypt.compare(pass, userr.pass);

    if (matchPass) {
      // Reset failed attempts on success
      userr.failedLoginAttempts = 0;
      userr.loginBlockedUntil = null;
      await userr.save();

      req.session.userEmail = {
        name: userr.name,
        email: userr.email
      };

      return res.json({ success: true, message: 'Login successful', userId: { name: userr.name, email: userr.email } });
    } else {
      // Increase failed attempts
     userr.failedLoginAttempts = (userr.failedLoginAttempts || 0) + 1;

let attemptsLeft = 3 - userr.failedLoginAttempts;

// Lock account after 3 failed attempts
if (userr.failedLoginAttempts >= 3) {
  userr.loginBlockedUntil = new Date(Date.now() + 1 * 60 * 1000);
  attemptsLeft = 0;
}

await userr.save();

if (attemptsLeft > 0) {
  return res.status(401).json({ message: `Incorrect password. ${attemptsLeft} attempt(s) left.` });
} else {
  return res.status(403).json({ message: 'Account temporarily locked for 1 minute due to multiple failed login attempts.' });
}

    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }

}

// --------------------------- choose plan

export const choosePlan = async (req, res) => {

   if (!req.session.userEmail || !req.session.userEmail.email) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { plan } = req.body;
  const email = req.session.userEmail.email;

  if (!plan) {
    return res.status(400).json({ success: false, message: "Missing plan" });
  }

  try {

    const user = await userMong.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

   // Prevent downgrades (e.g., from Premium to Advance or Advance to Basic)
    const planRank = { "Basic": 1, "Advance": 2, "Premium": 3 };

    if (user.plan && planRank[plan] <= planRank[user.plan]) {
      return res.status(409).json({ success: false, message: `You already have ${user.plan} plan or higher.` });
    }


    user.plan = plan;
    await user.save();

    return res.status(200).json({ success: true, message: "Plan successfully purchased", user });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }

}

// --------------------------- get user plan

export const getuserPlan = async (req, res) => {
  
  try {
    
    if (!req.session.userEmail || !req.session.userEmail.email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userMong.findOne({ email: req.session.userEmail.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }   
    return res.status(200).json({ success: true, plan: user.plan });
  } catch (error) { 
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


// -------------------------- send mail otp

export const sendMaill=async (req,res) => {
  
  const { email } = req.body;

  const user = await userMong.findOne({ email });

  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  req.session.otp = otp;
  req.session.emailForOtp = email;
  req.session.otpExpire = Date.now() + 10 * 60 * 1000; 

  await sendMail(email, otp);
  res.status(200).json({ message: 'OTP sent to email' }); 

}

// ------------------------- verify-otp

export const verifyOtp=async (req,res) => {
  
  const { otp } = req.body;

  if (
    req.session.otp === otp && req.session.otpExpire > Date.now()
  ) {
    req.session.otpVerified = true;
    return res.json({ success: true, message: 'OTP verified' });
  }

  return res.status(400).json({ message: 'Invalid or expired otp' });
}

// -------------------------- resend otp

export const resendOtp=async (req,res) => {
  
  const { email } = req.body;

  const user = await userMong.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  req.session.otp = otp;
  req.session.emailForOtp = email;
  req.session.otpExpire = Date.now() + 10 * 60 * 1000;

  await sendMail(email, otp);
  res.status(200).json({ message: 'OTP resent to email' });


}


// ------------------------ reset password

export const resetPassword = async (req, res) => {
  const { newPass } = req.body;

  if (!newPass || newPass.length < 6) {
  return res.status(400).json({ message: 'Password must be at least 6 characters' });
}


  if (!req.session.otpVerified || !req.session.emailForOtp) {
    return res.status(403).json({ message: 'OTP not verified' });
  }

  const hashedPass = await bcrypt.hash(newPass, 10);

  await userMong.findOneAndUpdate(
    { email: req.session.emailForOtp },
    { pass: hashedPass }
  );

  // Clear OTP session
  req.session.otp = null;
  req.session.otpExpire = null;
  req.session.otpVerified = null;
  req.session.emailForOtp = null;

  res.json({ success: true, message: 'Password reset successful' });
};


// -------------------------- check session

export const checkSession = async (req, res) => {
  if (req.session.userEmail) {
    return res.status(200).json({ loggedIn: true, userId: req.session.userEmail });
  } else {
    return res.status(200).json({ loggedIn: false });
  }
};

// ------------------------- post qr

export const postqrcode = async (req, res) => {
  const { url, withLogo = false } = req.body;

  if (!url || url.trim() === "") {
    return res.status(400).json({ error: 'URL is required' });
  }

  let planType = "Guest";
  let limit = 5;
  let email = null;
  let expiresAt = undefined;

  if (req.session.userEmail) {
    const user = await userMong.findOne({ email: req.session.userEmail.email });
    email = user.email;

    // ✅ Premium user
    if (user && user.plan === "Premium") {
      try {
        if (withLogo) {
          // ✅ Generate QR with logo
          const qrBuffer = await qrcode.toBuffer(url, { errorCorrectionLevel: 'H', type: 'png' });
          const logoPath = path.join(__dirname, '../assets/logo.png');
          const logoBuffer = fs.readFileSync(logoPath);

          const logoResized = await sharp(logoBuffer)
            .resize(60) // Smaller logo
            .png()
            .toBuffer();

          const qrWithLogo = await sharp(qrBuffer)
            .composite([{ input: logoResized, gravity: 'centre' }])
            .png()
            .toBuffer();

          const qrImageWithLogo = `data:image/png;base64,${qrWithLogo.toString('base64')}`;

          const newEntry = new qrMong({ url, qrImage: qrImageWithLogo, userEmail: email });
          await newEntry.save();

          return res.status(200).json({ qrImage: qrImageWithLogo, attemptsLeft: Infinity });
        } else {
          // ✅ Generate normal QR
          const qrImage = await qrcode.toDataURL(url);
          const newEntry = new qrMong({ url, qrImage, userEmail: email });
          await newEntry.save();

          return res.status(200).json({ qrImage, attemptsLeft: Infinity });
        }
      } catch (error) {
        console.error('Premium QR generation error:', error);
        return res.status(500).json({ error: 'QR generation failed' });
      }
    }

    // ✅ Advance user – unlimited QR without logo
    if (user.plan === "Advance") {
      try {
        const qrImage = await qrcode.toDataURL(url);
        const newEntry = new qrMong({ url, qrImage, userEmail: email });
        await newEntry.save();

        return res.status(200).json({ qrImage, attemptsLeft: Infinity });
      } catch (error) {
        console.error('Advance QR error:', error);
        return res.status(500).json({ error: 'QR generation failed' });
      }
    }

    // ✅ Basic user
    if (user.plan === "Basic") {
      planType = "Basic";
      expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    }

  } else {
    // Guest user
    expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  }

  // ✅ Limit check for Guest/Basic
  const today = new Date().toDateString();
  if (!req.session.lastQrGeneratedDate || req.session.lastQrGeneratedDate !== today) {
    req.session.lastQrGeneratedDate = today;
    req.session.qrCount = 1;
  } else {
    req.session.qrCount = (req.session.qrCount || 0) + 1;
  }

  if (req.session.qrCount > limit) {
    return res.status(429).json({
      message: `${planType} plan daily QR code limit reached (${limit}). Please upgrade for unlimited access.`,
      attemptsLeft: 0
    });
  }

  // ✅ Generate QR for Guest / Basic
  try {
    const qrImage = await qrcode.toDataURL(url);
    const newEntry = new qrMong({
      url,
      qrImage,
      userEmail: email,
      ...(expiresAt && { expiresAt })
    });

    await newEntry.save();

    const remaining = limit - req.session.qrCount;
    return res.status(200).json({ qrImage, attemptsLeft: remaining });
  } catch (error) {
    console.log('QR generation error:', error);
    return res.status(500).json({ error: 'QR generation failed' });
  }
};


// ------------------------ my qr

export const fetchqr = async (req, res) => {
  
  try {
    if (!req.session.userEmail) {
          return res.status(401).json({ message: 'Please login to view your URLs.' });
    }

    const userQr = await qrMong.find({ userEmail: req.session.userEmail?.email });

    return res.status(200).json({ qr: userQr });

  }

  catch (err) {
     return res.status(500).json({ message: 'Error while fetching Qr' });
  }

}

// ----------------------- user me for qr filter plans

export const userInfo = async (req, res) => {

  if (!req.session.userEmail) {
    return res.status(401).json({ isLoggedIn: false });
  }

  const user = await userMong.findOne({ email: req.session.userEmail.email });
  if (!user) return res.status(404).json({ isLoggedIn: false });

  res.json({
    isLoggedIn: true,
    role: user.plan, // basic | advance | premium
  });
};


// -------------------------- logout user

export const logoutUser = async (req, res) => {
  try {
    delete req.session.userEmail; // ✅ only delete user session
    return res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};
