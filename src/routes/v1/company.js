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

// Send photo to uploads folder

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

// Get photo from uploads folder

router.get('/uploads/:fileName', (req, res) => {
	const fileLocation = path.resolve('./uploads/' + req.params.fileName);
	res.sendFile(fileLocation);
});

// Post company data with pictures

router.post('/', uploadImages.single('foto'), async (req, res) => {
	const { name, model, description, production_years } = req.body;

	if (!name || !model || !description || !production_years) {
		return res.status(400).send({ err: 'Incorrect data passed' });
	}
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`INSERT INTO company(name, model, description, production_years, foto) VALUES (  ${mysql.escape(name)}, 
          ${mysql.escape(model)},   ${mysql.escape(description)},
			${mysql.escape(production_years)},'${req.file.filename}')`
		);

		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

// Filtering company table, by name

router.get('/filter/:name?', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`SELECT * , (select avg(rating) as rating from comments where company_id=c.id) as rating  FROM company c WHERE c.name = 
			${mysql.escape(req.params.name)}`
		);

		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

// Delete company row

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

// Update production_years

router.put('/:id', async (req, res) => {
	let userInput = req.body;
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`UPDATE company SET production_years = ${mysql.escape(userInput.production_years)}
			 WHERE id = ${mysql.escape(req.params.id)}`
		);

		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
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
