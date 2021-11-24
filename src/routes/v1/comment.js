const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const router = express.Router();

const { dbConfig } = require('../../config');
const { isLoggedIn } = require('../../middleware');

// post comment from users acount

router.post('/', isLoggedIn, async (req, res) => {
	const { company_id, comment, rating } = req.body;

	if (!comment || !rating) {
		return res.status(400).send({ err: 'Incorrect data passed' });
	}
	try {
		const query = `INSERT INTO comments ( company_id, comment, rating, users_id ) 
      VALUES ( ${mysql.escape(company_id)}, ${mysql.escape(comment)},
       ${mysql.escape(rating)}, ${mysql.escape(req.user.id)} )`;

		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(query);
		await con.end();

		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err: 'Sever Error' });
	}
});

// paduoda comentara ir kas ji parase

router.get('/:id', isLoggedIn, async (req, res) => {
	const { id } = req.params;

	try {
		const query = `
        SELECT com.id, c.comment, c.com_timestamp, c.rating, com.name, u.name
        FROM company com
        LEFT JOIN comments c
        ON (com.id = c.company_id)
        LEFT JOIN users u
        ON c.users_id = u.id
        WHERE com.id = ${mysql.escape(id)}`;

		console.log(id);

		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(query);
		await con.end();

		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err });
	}
});

app.delete('/:id', isLoggedIn, async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(`DELETE FROM coments WHERE id = ${mysql.escape(req.params.id)}`);
		await con.end();
		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err });
	}
});

module.exports = router;
