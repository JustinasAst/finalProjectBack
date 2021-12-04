const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const router = express.Router();

const { dbConfig } = require('../../config');
const { isLoggedIn } = require('../../middleware');

// Post comment from users acount

router.post('/:companyId/comments', isLoggedIn, async (req, res) => {
	const { companyId } = req.params;

	const { comment, rating, expenses, economy, price_drop } = req.body;

	if (!comment || !rating || !expenses || !economy || !price_drop) {
		return res.status(400).send({ err: 'Incorrect data passed' });
	}
	try {
		const query = `INSERT INTO comments ( company_id, comment, rating, expenses, economy, price_drop, users_id ) 
      VALUES ( ${mysql.escape(companyId)}, ${mysql.escape(comment)},
       ${mysql.escape(rating)},  ${mysql.escape(expenses)},  ${mysql.escape(economy)}, 
	   ${mysql.escape(price_drop)}, ${mysql.escape(req.user.user)} )`;

		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(query);
		await con.end();

		return res.send({ msg: 'added', data });
	} catch (err) {
		return res.status(500).send({ err: 'Sever Error' });
	}
});

// Get comments, join with user and comapany table

router.get('/:companyId/comments', async (req, res) => {
	const { companyId } = req.params;

	try {
		const query = `
        SELECT c.id, c.comment, c.com_timestamp, c.rating, c.expenses, c.economy, c.price_drop, com.name, u.name  AS user, c.users_id
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
});

// Delete comments

router.delete('/:companyId/comments/:id', isLoggedIn, async (req, res) => {
	try {
		const con = await mysql.createConnection(dbConfig);
		const [data] = await con.execute(
			`DELETE FROM comments WHERE id = ${mysql.escape(req.params.id)} AND users_id= ${req.user.user}`
		);
		await con.end();
		return res.send(data);
	} catch (err) {
		return res.status(500).send({ err });
	}
});

module.exports = router;
