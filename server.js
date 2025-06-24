import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import { nanoid } from 'nanoid';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import urlMong from './models/Url_Mong.js';
import { checkSession, choosePlan, fetchqr, getuserPlan, loginUser, logoutUser, postqrcode, registerUser, resendOtp, resetPassword, sendMaill, verifyOtp } from './controllers/userAuthentication.js';
import { registeredvalidator } from './validation/validation.js';
import admin from './routes/admin.js';
import { fileURLToPath } from 'url';
import userMong from './models/User_Mong.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');


app.use(cors({
    origin: process.env.BACKEND_URL,
    credentials: true
}));

// --------------------- for live

app.set('trust proxy', 1)

app.use(
    session({
      secret: "nexadvent123", 
      resave: false,
      saveUninitialized: false,
      cookie: { 
        sameSite: 'none',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
      }, 
    })
);
  
// ------------------- for local dev

// app.use(
//     session({
//       secret: "nexadvent123", 
//       resave: false,
//       saveUninitialized: false,
//       cookie: {
//   sameSite: 'lax',
//   secure: false,
//   httpOnly: true
//         },      
//     })
// );



// --------------------- mongodb connected

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDb Connected'))
    .catch(() => console.log('Error Occured'))


// ------------------------------ shorten url 

app.post('/api/short', async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: 'Url error' });
    }

    let expiresAt;

    // Guest user limit check
    if (!req.session.userEmail) {
      const today = new Date().toDateString();
      if (!req.session.lastGeneratedDate || req.session.lastGeneratedDate !== today) {
        req.session.lastGeneratedDate = today;
        req.session.urlCount = 1;
      } else {
        req.session.urlCount = (req.session.urlCount || 0) + 1;
      }

      if (req.session.urlCount > 5) {
        return res.status(429).json({ message: 'Daily limit reached (5 URLs). Please login for unlimited access.' });
      }

      // Guest: expire after 5 days
      expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    }

    // Logged-in user (Basic) limit check
    if (req.session.userEmail) {
      const user = await userMong.findOne({ email: req.session.userEmail.email });

      if (user && user.plan === "Basic") {
        const today = new Date().toDateString();
        if (!req.session.lastGeneratedDate || req.session.lastGeneratedDate !== today) {
          req.session.lastGeneratedDate = today;
          req.session.urlCount = 1;
        } else {
          req.session.urlCount = (req.session.urlCount || 0) + 1;
        }

        if (req.session.urlCount > 5) {
          return res.status(429).json({ message: 'Daily limit reached for Basic plan (5 URLs). Upgrade for unlimited access.' });
        }

        // Basic: expire after 5 days
        expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      }
    }

    const shortUrl = nanoid(8);

    const url = new urlMong({
      originalUrl,
      shortUrl,
      userEmail: req.session.userEmail?.email || null,
      ...(expiresAt && { expiresAt })
    });

    await url.save();
    return res.status(200).json({ message: 'Url Generated', url });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Error Occurred while generating URL' });
  }
});

app.get('/api/my-urls', async (req, res) => {
    try {
        if (!req.session.userEmail) {
            return res.status(401).json({ message: 'Please login to view your URLs.' });
        }

        const userUrls = await urlMong.find({ userEmail: req.session.userEmail?.email });

        return res.status(200).json({ urls: userUrls });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error while fetching URLs' });
    }
});


// ------------------------------ user register

app.post('/register',registeredvalidator, registerUser);

app.post('/login', loginUser);

app.get('/logout', logoutUser);

app.get('/check-session', checkSession);

app.post('/qrscan', postqrcode);

app.get('/fetchqr', fetchqr);

app.post('/send-mail', sendMaill);

app.post('/verify-otp', verifyOtp);

app.post('/reset-pass', resetPassword);

app.post('/resend-otp', resendOtp);

app.post('/choose-plan', choosePlan);

app.get('/get-user-plan', getuserPlan);





app.get('/:shortUrl',async (req,res) => {
    
    try {
        
        const { shortUrl } = req.params;

        const url = await urlMong.findOne({ shortUrl });
        if (url) {
            url.clicks++;
            await url.save();
            return res.redirect(url.originalUrl);
        }
        else {
            return res.status(404).json({ message: 'Url not found' });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server Error' });

    }

})

app.use('/admin', admin);

app.get('/', (req, res) => {
    res.render('adminLogin');
})



app.listen(process.env.PORT, () => {
    console.log('Server is started on port 1200');
})

