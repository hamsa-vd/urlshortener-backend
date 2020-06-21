const { jwt } = require('./initiations');

module.exports = function(req, res, next) {
	const token = req.headers['authorixation'].split(' ')[1];
	if (token)
		jwt.verify(token, process.env.JWT_SECRET_TOKEN, (err, username) => {
			if (err) res.json({ msg: 'token expired relogin' });
			req.username = username.username;
			next();
		});
	else res.json({ msg: 'Bearer Authorization required' });
};
