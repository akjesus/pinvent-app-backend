const nodeMailer = require("nodemailer");

const sendEmail = async (subject, message, send_to, send_from, reply_to) => {
  const transporter = nodeMailer.createTransport({
    service: "Outlook365",
    host: "smtp.office365.com",
    port: "587",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  });

  const options = {
    from: send_from,
    to: send_to,
    subject: subject,
    text: message,
    html: `<b>${message}</b>`,
    headers: { "Reply-To": reply_to },
    replyTo: reply_to,
  };

  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

module.exports = sendEmail;
