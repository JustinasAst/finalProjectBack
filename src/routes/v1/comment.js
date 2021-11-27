const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const router = express.Router();

const { dbConfig } = require('../../config');
const { isLoggedIn } = require('../../middleware');

// post comment from users acount

router.post('/:companyId/comments', isLoggedIn, async (req, res) => {
	const { companyId } = req.params;
	const { comment, rating } = req.body;

	if (!comment || !rating) {
		return res.status(400).send({ err: 'Incorrect data passed' });
	}
	try {
		const query = `INSERT INTO comments ( company_id, comment, rating, users_id ) 
      VALUES ( ${mysql.escape(companyId)}, ${mysql.escape(comment)},
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

router.get(
	'/:companyId/comments',
	/*isLoggedIn,*/ async (req, res) => {
		const { companyId } = req.params;

		try {
			const query = `
        SELECT com.id, c.comment, c.com_timestamp, c.rating, com.name, u.name
        FROM company com
        LEFT JOIN comments c
        ON (com.id = c.company_id)
        LEFT JOIN users u
        ON c.users_id = u.id
        WHERE com.id = ${mysql.escape(companyId)}`;

			const con = await mysql.createConnection(dbConfig);
			const [data] = await con.execute(query);
			await con.end();
			return res.send(data);
		} catch (err) {
			return res.status(500).send({ err });
		}
	}
);

router.delete('/:companyId/comments/:id', isLoggedIn, async (req, res) => {
	console.log(req.user);
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`DELETE FROM comments WHERE id = ${mysql.escape(req.params.id)} AND user_id= ${req.user.id}`
		);
		await con.end();
		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err });
	}
});

module.exports = router;
