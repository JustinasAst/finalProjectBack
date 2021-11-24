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

router.post('/company', isLoggedIn, uploadImages.single('foto'), async (req, res) => {
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

router.get('/company/:filter', async (req, res) => {
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

router.get('/company', async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`SELECT company.name, company.description, company.place, company.foto  FROM company`
		);
		await con.end();
		res.send(data);
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
});

module.exports = router;
