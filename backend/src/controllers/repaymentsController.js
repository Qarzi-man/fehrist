const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const { debt_id } = req.params;

    // Verify debt belongs to user
    const debt = await pool.query(
      `SELECT id FROM debts WHERE id = $1 AND user_id = $2`,
      [debt_id, req.user.userId]
    );
    if (!debt.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await pool.query(
      `SELECT * FROM repayments WHERE debt_id = $1 ORDER BY paid_at DESC`,
      [debt_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { debt_id } = req.params;
    const { amount, note } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });

    // Verify debt belongs to user
    const debt = await pool.query(
      `SELECT * FROM debts WHERE id = $1 AND user_id = $2`,
      [debt_id, req.user.userId]
    );
    if (!debt.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await pool.query(
      `INSERT INTO repayments (debt_id, amount, note) VALUES ($1, $2, $3) RETURNING *`,
      [debt_id, amount, note || null]
    );

    // Auto-close debt if fully paid
    const totalPaid = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid FROM repayments WHERE debt_id = $1`,
      [debt_id]
    );
    if (parseFloat(totalPaid.rows[0].paid) >= parseFloat(debt.rows[0].amount)) {
      await pool.query(`UPDATE debts SET status = 'paid' WHERE id = $1`, [debt_id]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
