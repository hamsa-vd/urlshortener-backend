const { _, bcrypt, mongoClient, mongoUrl, dbName, jwt, __ } = require('./initiations');
const { transporter, activateOptions, forgotOptions } = require('./nodemail');
const { tokenAuth } = require('./middleware');
const shortid = require('shortid');
const objectId = require('mongodb').ObjectID;
const shortId = require('shortid');
module.exports = function(app) {
	app.post('/api/register', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.json({ status: 'failed', msg: err });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const emailcheck = await collection.findOne({ email: req.body.email });
			const namecheck = await collection.findOne({ username: req.body.username });
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
						await transporter.sendMail(activateOptions(req.body.email, data['_id']), (err, info) => {
							if (err) {
								collection.remove({ _id: data['_id'] });
								res.json({ msg: 'Unable to send email', err });
							} else res.status(201).json({ msg: 'successfully added and activation mail sent' });
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
			const data = await collection.findOne({ _id: new objectId(req.params.id) });
			if (data)
				collection.updateOne(
					{ _id: new objectId(req.params.id) },
					{ $set: { activated: true } },
					(err, result) => {
						if (err) {
							client.close();
							res.status(501).json({ msg: 'unable to activate account' });
						}
						res.status(200).json({ msg: 'account successfully activated' });
					}
				);
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
					if (err) res.status(501).json({ msg: 'Unable to send email' });
					else res.status(201).json({ msg: 'change password' });
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
			const data = await collection.findOne({ _id: new objectId(req.body.id) });
			if (data) {
				bcrypt.hash(req.body.password, 10, async function(err, hash) {
					if (err) res.status(501).json({ status: 'failed', msg: err });
					collection.updateOne(
						{ _id: new objectId(req.body.id) },
						{ $set: { password: hash } },
						(err, result) => {
							client.close();
							if (err) res.status(501).json({ msg: 'unable to update account' });
							res.status(200).json({ msg: 'password successfully updated' });
						}
					);
				});
			} else {
				client.close();
				res.status(401).json({ msg: 'no such id is found' });
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
					async (err, result) => {
						if (err) {
							client.close();
							res.status(501).json({ msg: 'please reenter the url by refreshing the page' });
						}
						const matter = await collection.findOne({ username: req.username });
						client.close();
						res.json({ msg: 'successfully generated', data: matter.urls });
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
			else res.status(404).json({ msg: 'Enter a big Url' });
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

	app.get('/go/:id', (req, res) => {
		mongoClient.connect(mongoUrl, async (err, client) => {
			if (err) res.status(502).json({ msg: 'refresh and try again' });
			const db = client.db(dbName);
			const collection = db.collection('users');
			const data = await collection.findOne({ urls: { $elemMatch: { shorturl: req.params.id } } });
			if (!data)
				res.status(404).send(
					`<div style="width:100vw;text-align:center">
						<h1 style="font-size:4vw ; color:red">404 page not found</h1>
					</div>`
				);
			const url = data.urls.find((v) => v.shorturl == req.params.id).fullurl;
			client.close();
			res.redirect(url);
		});
	});
};
