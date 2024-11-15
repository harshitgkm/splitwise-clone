const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verification Code',
    text: `Your OTP code is ${otp}`,
  };
  console.log(`email in mail helper: ${email}`);
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

const sendExpenseNotification = async (
  emailAddresses,
  expense,
  description,
  amount,
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailAddresses,
    subject: 'New Expense Added',
    text: `A new expense has been added to your group:\n
           Description: ${description}\n
           Amount: $${amount}\n
           Expense ID: ${expense.id}\n\n
           You can view the details in the app.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification emails sent successfully');
  } catch (error) {
    console.error('Error sending notification emails:', error);
  }
};

module.exports = { sendOtpEmail, sendExpenseNotification };
