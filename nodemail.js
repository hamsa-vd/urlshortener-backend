const initiations = require('./initiations');
const nodemailer = initiations.nodeMailer;

let transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER, // generated ethereal user
		pass: process.env.EMAIL_PASS // generated ethereal password
	},
	tls: {
		rejectUnauthorized: false
	}
	// debug: true,
	// logger: true
});

let activateOptions = (email, id) => ({
	from: `"Hamsa Vardhan" <${process.env.EMAIL_USER}>`, // sender address
	to: email, // list of receivers
	subject: 'Activate Account', // Subject line
	text: 'click on the below button to activate your account', // plain text body
	html: `<button style="border:none;border-radius:10px;padding:1rem 3rem;background-color:#8595ad;font-size:1rem">
			<a href="http://localhost:4200/activate/${id}" 
			style="text-decoration:none;color:white">Activate</a></button>` // html body
});

let forgotOptions = (email, id) => ({
	from: `"Hamsa Vardhan" <${process.env.EMAIL_USER}>`, // sender address
	to: email, // list of receivers
	subject: 'Change Password', // Subject line
	text: 'click on the below button to change your account password', // plain text body
	html: `<button style="border:none;border-radius:10px;padding:1rem 3rem;background-color:#8595ad;font-size:1rem">
				<a href="http://localhost:4200/passwordNew/${id}" 
				style="text-decoration:none;color:white">change password</a></button>` // html body
});
module.exports = { transporter, activateOptions, forgotOptions };
