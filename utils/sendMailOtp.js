import nodemailer from 'nodemailer';

const sendMail = async (email, otp) => {
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }

    })

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Forget Password Otp',
        html: `
            <h2>Forget Password OTP</h2>
            <p>Your OTP for forget password is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 5 minutes. Do not share it with anyone.</p>
            `
    }

    await transporter.sendMail(mailOptions);

}

export default sendMail;