const nodemailer = require('nodemailer')

const sendEmail = async options => {
  // 1.Create a transporter
  const transporter = nodemailer.createTransport({
    // ******* Use service from Gmail
    // Gmail is not suitable for production because Gmail has a limit of 500 emails per day and if you send too many emails, it will mark as spam. So the popular services is SendGrid and MailGun
    // You will need to add "less secure app" to settings on your email account
    // service: 'Gmail',
    // auth: {
    //   user: process.env.EMAIL_USERNAME,
    //   password: process.env.EMAIL_PASSWORD
    // }
    // ******* Use service from Gmail

    // ******* Use service from Mailtrap
    // get the host, port, username and password from the mailtrap inbox
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // ******* Use service from Mailtrap
  })

  // 2. Define the email options
  const mailOptions = {
    from: 'Phong <admin@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  }

  // 3. Actually send the email
  transporter.sendMail(mailOptions)
}

module.exports = sendEmail
