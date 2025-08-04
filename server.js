import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import { nanoid } from 'nanoid';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import urlMong from './models/Url_Mong.js';
import { checkSession, choosePlan, fetchqr, getuserPlan, loginUser, logoutUser, postqrcode, registerUser, resendOtp, resetPassword, sendMaill, userInfo, verifyOtp } from './controllers/userAuthentication.js';
import { registeredvalidator } from './validation/validation.js';
import admin from './routes/admin.js';
import guestMong from './models/Guest_Mong.js';
import { fileURLToPath } from 'url';
import userMong from './models/User_Mong.js';
import bcrypt from 'bcrypt';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import checkPlanExpiry from "./middlewares/checkPlanExpiry.js";
import upload from './middlewares/multer.js';

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



// 🔐 Apply middleware globally to all user-related routes

app.use(checkPlanExpiry);

app.get("/ping", (req, res) => {
  res.send("OK");
});


// ------------------------------ shorten url 

app.post('/api/short', async (req, res) => {
  try {
    const { originalUrl, password } = req.body;
    if (!originalUrl) return res.status(400).json({ message: 'Url error' });

    let expiresAt;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const today = new Date().toDateString();
    let passwordHash = null;

    // 🧑‍🦲 Guest
    if (!req.session.userEmail) {
      const guest = await guestMong.findOne({ ip, date: today });
      if (!guest) {
        await guestMong.create({ ip, date: today, count: 1 });
      } else {
        if (guest.count >= 5) {
          return res.status(429).json({ message: 'Guest limit reached (5 URLs). Please login and Upgrade to Premium.' });
        }
        guest.count++;
        await guest.save();
      }
      expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    }

    // 👤 Logged-in user
    if (req.session.userEmail) {
      const user = await userMong.findOne({ email: req.session.userEmail.email });
      if (user) {
        if (user.isBanned) return res.status(403).json({ message: "User is banned." });

        const plan = user.plan;

        if (plan === "Basic" || plan === "Advance") {
          let log = user.urlLogs.find(l => l.date === today);
          const limit = plan === "Basic" ? 5 : 10;

          if (!log) {
            user.urlLogs.push({ date: today, count: 1 });
          } else {
            if (log.count >= limit) {
              return res.status(429).json({ message: `Daily limit reached for ${plan} plan (${limit} URLs)` });
            }
            log.count++;
          }

          await user.save();
          expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        }

        // ✅ Premium user with optional password
        if (user.plan === "Premium") {
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }
}
      }
    }

    const shortUrl = nanoid(8);
    const url = new urlMong({

      originalUrl,
      shortUrl,
      userEmail: req.session.userEmail?.email || null,
      passwordHash,
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

// ------------------------------ password protected route

app.post('/api/verify-url/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const { password } = req.body;

    const url = await urlMong.findOne({ shortUrl });
    if (!url) return res.status(404).json({ message: "URL not found" });

    // No password required
    if (!url.passwordHash) {
      return res.status(200).json({ originalUrl: url.originalUrl });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, url.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    return res.status(200).json({ originalUrl: url.originalUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying password" });
  }
});

app.get('/api/url/check/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await urlMong.findOne({ shortUrl });

    if (!url) return res.status(404).json({ message: 'URL not found' });

    if (!url.passwordHash) {
      return res.status(200).json({ originalUrl: url.originalUrl, protected: false });
    } else {
      return res.status(200).json({ protected: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Redirect handler: GET /r/:shortUrl
app.get('/r/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await urlMong.findOne({ shortUrl });

    if (!url) return res.status(404).send("Short URL not found");

    if (!url.passwordHash) {
      // No password: redirect directly
      return res.redirect(url.originalUrl);
    } else {
      // Password protected: redirect to frontend page to enter password
      return res.redirect(`${process.env.BACKEND_URL}/redirect/${shortUrl}`);
      // OR: `/verify/${shortUrl}` if that's your route in React
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



// ------------------------------ user register

app.post('/register',registeredvalidator, registerUser);

app.post('/login', loginUser);

app.get('/logout', logoutUser);

app.get('/check-session', checkSession);

app.post('/qrscan', upload.single('logoImage'), postqrcode);

app.get('/fetchqr', fetchqr);

app.post('/send-mail', sendMaill);

app.post('/verify-otp', verifyOtp);

app.post('/reset-pass', resetPassword);

app.post('/resend-otp', resendOtp);

app.post('/choose-plan', choosePlan);

app.get('/get-user-plan', getuserPlan);

app.get('/getUserRole', userInfo);






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

