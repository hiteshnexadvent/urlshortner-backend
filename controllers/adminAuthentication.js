import adminMong from '../models/Admin_Mong.js';
import bcrypt from 'bcrypt';

// ------------------------- admin Signup

export const getadminSignup = (req, res) => {
    res.render('adminSignup');
}

export const adminSignup=async (req,res) => {
    
    const { name, email, mobile, pass } = req.body;
    
    try {
        const exist = await adminMong.findOne({ email });

        if (exist) {
            return res.send('<script>alert("Admin with this email already exist"); window.history.back();</script>');
        }

        const hashedPass = await bcrypt.hash(pass, 10);

        const newAdmin = new adminMong({
            name, email, mobile, pass: hashedPass
            
        })

        await newAdmin.save();
        return res.send('<script>alert("Admin registered successfull"); window.history.back();</script>');

    }

    catch (err) {
        console.log(err.message);
        return res.send('<script>alert("error"); window.history.back();</script>');
    }

}

// ------------------------- admin Login

export const adminLogin=async (req,res) => {
    
    const { email, pass } = req.body;

    try {

        const admin = await adminMong.findOne({ email });

        if (!admin) {
            return res.send('<script>alert("Admin does not exist"); window.history.back();</script>');
        }

        const isMatch = await bcrypt.compare(pass, admin.pass);

        if (!isMatch) {
            return res.send('<script>alert("Incorrect Password"); window.history.back();</script>');

        }

        req.session.adminEmail = { email: admin.email, name: admin.name };

        // return res.send('<script>alert("User Login Successfull"); window.history.back();</script>');

        return res.redirect('/admin/adminDash');       
    } catch (err) {
        console.error(err);
        return res.send('<script>alert("Error occurred, please try again later")</script>');
    }

}

// ---------------------- admin dashboard

export const adminDash = (req, res) => {
    if (!req.session.adminEmail) {
        return res.render('adminLogin');
    } else {
        const { email,name } = req.session.adminEmail;
        return res.render('adminDash', { email, name });
    }
}

// -------------------------- change password

export const getchangePass = (req, res) => {
    if (!req.session.adminEmail) {
        return res.render('adminLogin');
    } else {
        return res.render('changePass');
    }
}

export const postchangePass=async (req,res) => {
 
    const { password, npassword, cnpassword } = req.body;

    if (!password || !npassword || !cnpassword) {
        return res.send('<script>alert("All fields are mandatory"); window.history.back();</script>');
    } 

    if (npassword !== cnpassword) {
        return res.send('<script>alert("Password and Confirm Password must be same"); window.history.back();</script>');
    }

    const email = req.session.adminEmail;
    
    if (!email) {
        return res.render('adminLogin');
    }


    try {
        const adminn = await adminMong.findOne({ email: email.email });

        if (!adminn) {
            return res.send('<script>alert("Old PAssword is wrong"); window.history.back();</script>');
        } 

         const isMatch = await bcrypt.compare(password, adminn.pass);
        if (!isMatch) {
            return res.send('<script>alert("Current Password is Incorrect"); window.history.back();</script>');
        }

        const hashedNewPass = await bcrypt.hash(npassword, 10);

        adminn.pass = hashedNewPass;

        await adminn.save();

        return res.send('<script>alert("Password Changed Successfully"); window.history.back();</script>');
        
    }
    
    catch (err) {

        return res.send(err.message);

    }
    
}

// -------------------------- admin Logout

export const adminLogout = async (req, res) => {
    if (!req.session.adminEmail) {
        return res.redirect('/'); 
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.send('<script>alert("Unable to logout."); window.history.back();</script>');
        }

        res.clearCookie('connect.sid'); 
        return res.redirect('/');
    });
};
