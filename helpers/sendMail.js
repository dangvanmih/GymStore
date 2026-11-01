const nodemailer = require('nodemailer');

module.exports.sendMail = async (email, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,     // Email của hệ thống (ví dụ: gmail của bạn)
      pass: process.env.EMAIL_PASSWORD  // Mật khẩu ứng dụng (App Password) của Gmail
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: html
  };

  return transporter.sendMail(mailOptions);
};
