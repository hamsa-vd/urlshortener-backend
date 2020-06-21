const initiations = require('./initiations');
const nodemailer = initiations.nodeMailer;

let transporter = nodemailer.createTransport({
	host: 'smtp.yahoo.com',
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER, // generated ethereal user
		pass: process.env.EMAIL_PASS // generated ethereal password
	},
	tls: {
		rejectUnauthorized: false
	},
	debug: true,
	logger: true
});

module.exports = { transporter };
