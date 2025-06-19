import userMong from '../models/User_Mong.js';
import qrMong from '../models/Qr_Mong.js';
import bcrypt from 'bcrypt';
import qrcode from 'qrcode';
import { validationResult } from 'express-validator';

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

export const loginUser=async (req,res) => {
    
    try {
        
    const { email, pass } = req.body;

    const userr = await userMong.findOne({ email });

    if (!userr) {
      return res.status(404).json({ message: 'User not exists' });       
    }

        const matchPass = await bcrypt.compare(pass, userr.pass);
        
        if (matchPass) {
            req.session.userEmail = {
                name: userr.name,
                email: userr.email
            };

            return res.json({ success: true, message: 'Login successfull', userId: { name: userr.name, email: userr.email } });
            
        }
        else {
            return res.status(401).json({ message: 'Incorrect Password' });
        }

    }
    catch (err) {
        res.json(err.message);
    }

}

export const logoutUser = async (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Cannot logout' });
      }
      return res.status(200).json({ success: true, message: 'Logout successful' });
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

export const postqrcode=async (req,res) => {
  
  const { url } = req.body;

  if (!url || url.trim() === "") {
      return res.status(400).json({ error: 'URL is required' });
  }

  if (!req.session.userEmail) {
              const today = new Date().toDateString();
              if (!req.session.lastGeneratedDate || req.session.lastGeneratedDate !== today) {
                  req.session.lastGeneratedDate = today;
                  req.session.urlCount = 1;
              } else {
                  req.session.urlCount = (req.session.urlCount || 0) + 1;
              }
  
              if (req.session.urlCount > 5) {
                  return res.status(429).json({ message: 'Daily limit reached (5 QR codes). Please login to generate unlimited QR codes.' });
              }
          }
  

  try {

    const qrImage = await qrcode.toDataURL(url);
    const newEntry = new qrMong({
      url, qrImage, userEmail: req.session.userEmail?.email || null
    });

    await newEntry.save();
    return res.json({ qrImage });

  } catch (error) {
    
    console.log('Qr generation error', error);
    return res.status(500).json({ error: 'QR generation failed' });

  }

}

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