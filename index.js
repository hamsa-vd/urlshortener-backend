const bodyParser = require('body-parser');
const route = require('./routes');
const cors = require('cors');
const initiations = require('./initiations');
const app = initiations.express();
app.use(bodyParser.json());
app.use(cors());
route(app);
app.get('/', (req, res) => {
	const available = {
		METHOD: 'URL',
		POST: '/api/register',
		POST2: '/api/login',
		GET: '/api/activate:email'
	};
	res.json(available);
});

const port = process.env.PORT || 3000;
app.listen(port, (_) => console.log(`app is listening at port ${port}.......`));
