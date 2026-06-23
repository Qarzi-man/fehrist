const pool = require('../config/db');
const { createNotification } = require('../services/notificationsService');

async function list(req, res, next) {
  try {
    const { debt_id } = req.params;

    const debt = await pool.query(
      `SELECT id FROM debts WHERE id = $1 AND business_id = $2`,
      [debt_id, req.businessId]
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

    const debt = await pool.query(
      `SELECT d.*, c.full_name AS client_name FROM debts d
       JOIN clients c ON c.id = d.client_id
       WHERE d.id = $1 AND d.business_id = $2`,
      [debt_id, req.businessId]
    );
    if (!debt.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await pool.query(
      `INSERT INTO repayments (debt_id, amount, note) VALUES ($1, $2, $3) RETURNING *`,
      [debt_id, amount, note || null]
    );

    const totalPaid = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid FROM repayments WHERE debt_id = $1`,
      [debt_id]
    );
    const d = debt.rows[0];
    if (parseFloat(totalPaid.rows[0].paid) >= parseFloat(d.amount)) {
      await pool.query(`UPDATE debts SET status = 'paid' WHERE id = $1`, [debt_id]);
    }

    // Notify business owner about payment
    const biz = await pool.query('SELECT owner_id FROM businesses WHERE id = $1', [req.businessId]);
    if (biz.rows.length) {
      createNotification({
        userId: biz.rows[0].owner_id,
        businessId: req.businessId,
        type: 'payment_received',
        title: 'Получена оплата',
        body: `${d.client_name}: ${amount} ${d.currency}`,
        data: { debt_id: Number(debt_id), client_name: d.client_name, amount: Number(amount), currency: d.currency },
      });
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
