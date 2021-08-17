import nodemailer from 'nodemailer';

const sendEmail = async options => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST_EMAIL,
    port: process.env.PORT_EMAIL,
    auth: {
      user: process.env.USER_NAME_EMAIL,
      pass: process.env.PASSWORD_EMAIL
    }
  });

  const mailOptions = {
    from: 'Mohammad Ismail <ismailinayat@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  await transporter.sendMail(mailOptions);
};

export default sendEmail;