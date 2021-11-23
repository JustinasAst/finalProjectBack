const express = require('express');
const cors = require('cors');

const auth = require('./routes/v1/auth');
const company = require('./routes/v1/company');

const { port } = require('./config');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/v1/auth', auth);
app.use('/v1/company', company);

app.get('/', (req, res) => {
	res.send({ msg: 'Hello from the other side' });
});

app.all('*', (req, res) => {
	res.status(404).send({ msq: 'Page not exsist' });
});

app.listen(port, () => 'Server is running on port 3000');
