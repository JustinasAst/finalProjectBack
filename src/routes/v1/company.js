const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config();

const app = express();

app.use(express.json());

app.use(cors());

const { dbConfig } = require('../../config');
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

// Post company data

router.post('/', /* isLoggedIn, */ uploadImages.single('foto'), async (req, res) => {
	let userInput = req.body;
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`INSERT INTO company(name, model, description, production_years, foto) VALUES (  ${mysql.escape(userInput.name)}, 
          ${mysql.escape(userInput.model)},   ${mysql.escape(userInput.description)},
			${mysql.escape(userInput.production_years)},'${req.file.filename}')`
		);

		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

router.get('/uploads/:fileName', (req, res) => {
	const fileLocation = path.resolve('./uploads/' + req.params.fileName);
	res.sendFile(fileLocation);
});

router.get('/filter/:name', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`SELECT * , (select avg(rating) as rating from comments where company_id=c.id) as rating  FROM company c WHERE c.name = 
			${mysql.escape(req.params.name)}`
		);
		// `SELECT * , (select avg(rating) as rating , avg(economy)as aconomy, avg(pricedrom)as aconomy from comments where company_id=c.id) `

		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

router.delete('/:id', async (req, res) => {
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
