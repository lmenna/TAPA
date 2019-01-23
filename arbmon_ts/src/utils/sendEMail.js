var nodemailer = require("nodemailer");
var numSent = {};

function SendMessage(Subject, Message) {

  console.log("Email message: ", Message);
  if(!numSent[Subject]) {
    numSent[Subject] = 0;
  }
  else {
    if (numSent[Subject] > 1) {
      console.log("Too many emails for:" + Subject);
      return;
    }
  }
  numSent[Subject]++;
  var u   = process.env.emailU;
  var p = process.env.emailP;
  if (!u || !p) {
    console.log("Either the username or password not set in the environment.  No email was sent.");
    return;
  }

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: u,
      pass: p
    }
  });

  var mailOptions = {
    from: "louismenna3@gmail.com",
    to: "louismenna@yahoo.com",
    subject: Subject,
    html: Message
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    }
    else {
      console.log("Email sent: " + info.response);
    }
  });
}

export {SendMessage};
