const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config();

const app = express();

app.use(express.json());

app.use(cors());

const { dbConfig, jwtSecret } = require('../../config');
const { isLoggedIn } = require('../../middleware');

const router = express.Router();

const generateFileName = (req, file, cb) => {
	cb(null, new Date().getTime() + file.originalname);
};

const diskStorage = multer.diskStorage({
	destination: './uploads',
	filename: generateFileName,
});

const uploadImages = multer({
	storage: diskStorage,
});

router.post('/', isLoggedIn, uploadImages.single('foto'), async (req, res) => {
	let userInput = req.body;
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`INSERT INTO company(name, description, filter, place, foto) VALUES (  ${mysql.escape(userInput.name)}, 
            ${mysql.escape(userInput.description)}, ${mysql.escape(userInput.filter)}, 
			${mysql.escape(userInput.place)},'${req.file.filename}')`
		);
		console.log(req.file.filename);
		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

router.get('/filter/:filter', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(`SELECT * FROM company WHERE filter = ${req.params.filter}`);
		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

router.get('/', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`SELECT *, (select avg(rating) as rating from comments where company_id=c.id) as rating  FROM company c`
		);

		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

router.delete('/company/:id', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(`DELETE FROM company WHERE id = ${mysql.escape(req.params.id)}`);
		await con.end();
		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(`SELECT * FROM company WHERE id = ${Number(req.params.id)} limit 1`);
		await con.end();
		return res.send(data[0]);
	} catch (err) {
		return res.status(500).send({ err });
	}
});

module.exports = router;
