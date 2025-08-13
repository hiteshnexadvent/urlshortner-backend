import nodemailer from "nodemailer";

const thankMail = async (name,email,plan, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Link Crisp ${process.env.EMAIL_USER}`,
    to: email,
    subject: "Thanks for subscribing!!",
    html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for upgrading to the <b>${plan}</b> plan! 🎉</p>
        <p>Your plan is now active and will expire in 30 days.</p>
        <br>
        <p>We're excited to have you onboard.</p>
        <br/>
        <p>Cheers,<br/>The Link Crisk Team</p>
      `,
  };

  await transporter.sendMail(mailOptions);
};

export default thankMail;
