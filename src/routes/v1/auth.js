const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

require('dotenv').config();

const { dbConfig, jwtSecret } = require('../../config');

const router = express.Router();

// REGISTRATION

router.post('/register', async (req, res) => {
	const registerSchema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().email().trim().required(),
		password: Joi.string().min(6).max(30).required(),
	});

	let userInputs = req.body;

	try {
		userInputs = await registerSchema.validateAsync(userInputs);
	} catch (err) {
		return res.status(400).send({ err: 'Incorrect data provided' });
	}
	const encryptedPassword = bcrypt.hashSync(userInputs.password);

	try {
		const query = `INSERT INTO users(name, email, password)VALUES
      (${mysql.escape(userInputs.name)}
        , ${mysql.escape(userInputs.email)},
        '${encryptedPassword}')`;

		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(query);
		await con.end();

		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err: 'server error' });
	}
});

// LOGIN

router.post('/login', async (req, res) => {
	const loginSchema = Joi.object({
		email: Joi.string().email().trim().required(),
		password: Joi.string().min(6).max(30).required(),
	});

	let userInputs = req.body;

	try {
		userInputs = await loginSchema.validateAsync(userInputs);
	} catch (err) {
		return res.status(401).send({ err: 'Incorrect data passed' });
	}

	try {
		const query = `SELECT * FROM users WHERE email = ${mysql.escape(userInputs.email)}LIMIT 1`;

		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(query);
		await con.end();

		if (data.length === 0) {
			return res.status(400).send({ err: 'Wrong email' });
		}

		const passwordCorect = bcrypt.compareSync(userInputs.password, data[0].password);

		const token = jwt.sign(
			{
				user: data[0].id,
				email: data[0].email,
			},
			jwtSecret
		);
		return passwordCorect
			? res.send({ token, id: data[0].id, name: data[0].id, user: data[0].id })
			: res.status(400).send({ err: 'Incorrect password' });
	} catch (err) {
		return res.status(500).send({ err });
	}
});

module.exports = router;
