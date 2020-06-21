const { _, bcrypt, mongoClient, mongoUrl, dbName, __ } = require('./initiations');
const { transporter } = require('./nodemail');
module.exports = function(app) {
	app.post('/api/register', (req, res) => {
		mongoClient.connect(mongoUrl, (err, client) => {
			if (err) res.json({ status: 'failed', msg: err });
			const db = client.db(dbName);
			const collection = db.collection('users');
			bcrypt.hash(req.body.password, 10, function(err, hash) {
				if (err) res.json({ status: 'failed', msg: err });
				else collection.insertOne({ ...req.body, password: hash });
				collection.find({}).toArray().then((v) => {
					console.log(v);
					res.json({ status: 'success', msg: 'successfully added' });
				});
			});
		});
	});
	app.post('/api/login', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.json({ status: 'failed', msg: err });
			const db = client.db(dbName);
			const collection = db.collection('users');
			console.log(req.body);
			const hash = await collection.find({ username: req.body.username }).toArray();
			console.log(hash);
			bcrypt.compare(req.body.password, hash[1].password, function(err, result) {
				console.log(result);
				res.send(result);
			});
		});
	});

	app.get('/api/activate', async (req, res) => {
		const email = 'hamsavardhan99@gmail.com';
		await transporter.sendMail(
			{
				from: `"Hamsa Vardhan" <${process.env.EMAIL_USER}>`, // sender address
				to: email, // list of receivers
				subject: 'Activate Account', // Subject line
				text: 'click on the below button to activate your account', // plain text body
				html: `<button style="padding:1rem 3rem;background-color:black;font-size:1rem">
			<a href="http://localhost:4200/passwordNew" 
			style="text-decoration:none;color:white">Activate</a></button>` // html body
			},
			(err, info) => {
				if (err) res.json({ msg: err });
				else res.json({ msg: info.response });
			}
		);
	});
};
