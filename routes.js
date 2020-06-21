const { _, bcrypt, mongoClient, mongoUrl, dbName, shortId, jwt, __ } = require('./initiations');
const { transporter, activateOptions, forgotOptions } = require('./nodemail');
const tokenAuth = require('./middleware');
module.exports = function(app) {
	app.post('/api/register', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.json({ status: 'failed', msg: err });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const emailcheck = collection.findOne({ email: req.body.email });
			const namecheck = collection.findOne({ username: req.body.username });
			if (!emailcheck)
				if (!namecheck)
					bcrypt.hash(req.body.password, 10, async function(err, hash) {
						if (err) res.status(501).json({ status: 'failed', msg: err });
						await collection.insertOne({
							...req.body,
							password: hash,
							urls: [],
							token: '',
							activated: false
						});
						const data = await collection.findOne({ email: req.body.email });
						client.close();
						await transporter.sendMail(activateOptions(req.body.email, data['_id']), (err, info) => {
							if (err) res.json({ msg: 'Unable to send email' });
							else res.status(201).json({ msg: 'successfully added and activation mail sent' });
						});
					});
				else {
					client.close();
					res.status(401).json({ msg: 'username is already taken' });
				}
			else {
				client.close();
				res.status(401).json({ msg: 'email already exists' });
			}
		});
	});
	app.post('/api/login', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const hash = await collection.findOne({ username: req.body.username });
			if (hash)
				if (hash.activated)
					bcrypt.compare(req.body.password, hash.password, async function(err, result) {
						if (err) {
							client.close();
							res.status().json({ msg: 'invalid password' });
						}
						const token = jwt.sign({ username: req.body.username }, process.env.JWT_SECRET_KEY);
						await collection.updateOne({ username: req.body.username }, { $set: { token: token } });
						client.close();
						res.status(200).json({
							msg: 'successfully logged in',
							data: { username: req.body.username, token: token }
						});
					});
				else {
					client.close();
					res.status(401).json({ msg: 'activate your account' });
				}
			else {
				client.close();
				res.status(400).json({ msg: "username doesn't exist" });
			}
		});
	});

	app.get('/api/activate/:id', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.findOne({ _id: req.params.id });
			if (data)
				collection.updateOne({ _id: req.params.id }, { $set: { activated: true } }, (err, result) => {
					if (err) {
						client.close();
						res.status(501).json({ msg: 'unable to activate account' });
					}
					res.status(200).json({ msg: 'account successfully activated' });
				});
			else {
				client.close();

				res.status(501).json({ msg: 'unable to activate account' });
			}
		});
	});
	app.post('/api/forgot', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.findOne({ email: req.body.email });
			if (data) {
				client.close();
				await transporter.sendMail(forgotOptions(req.body.email, data['_id']), (err, info) => {
					if (err) res.json({ msg: 'Unable to send email' });
					else res.status(201).json({ msg: 'check your mail  to change password' });
				});
			} else {
				client.close();
				res.status(401).json({ msg: 'no such email is found' });
			}
		});
	});

	app.post('/api/changepass', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.findOne({ _id: req.body.id });
			if (data) {
				bcrypt.hash(req.body.password, 10, async function(err, hash) {
					if (err) res.status(501).json({ status: 'failed', msg: err });
					collection.updateOne({ _id: req.body.id }, { $set: { password: hash } }, (err, result) => {
						client.close();
						if (err) res.status(501).json({ msg: 'unable to update account' });
						res.status(200).json({ msg: 'password successfully updated' });
					});
				});
			} else {
				client.close();
				res.status(401).json({ msg: 'no such email is found' });
			}
		});
	});

	app.post('/api/posturls', tokenAuth, (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.findOne({ username: req.username });
			if (data) {
				const shorturl = shortId.generate();
				const fullurl = req.body.fullurl;
				collection.updateOne(
					{ username: req.username },
					{ $push: { urls: { fullurl, shorturl } } },
					(err, result) => {
						if (err) {
							client.close();
							res.status(501).json({ msg: 'please reenter the url by refreshing the page' });
						}
						res.json({ msg: 'successfully generated' });
					}
				);
			} else {
				client.close();
				res.status(401).json({ msg: 'no such email is found' });
			}
		});
	});

	app.get('/api/geturls', tokenAuth, (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.findOne({ username: req.username });
			client.close();
			if (data) res.json({ data: data.urls });
			else res.json({ msg: 'Enter a big Url' });
		});
	});

	app.get('/api/all', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.find({}).toArray();
			client.close();
			res.json({ data });
		});
	});
};
