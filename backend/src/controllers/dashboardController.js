const pool = require('../config/db');

async function stats(req, res, next) {
  try {
    const uid = req.user.userId;

    const [receivable, payable, overdue, recent] = await Promise.all([
      pool.query(
        `SELECT d.currency, COALESCE(SUM(d.amount - COALESCE(r.paid, 0)), 0) AS total
         FROM debts d
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
           ON r.debt_id = d.id
         WHERE d.user_id = $1 AND d.type = 'receivable' AND d.status = 'active'
         GROUP BY d.currency`,
        [uid]
      ),
      pool.query(
        `SELECT d.currency, COALESCE(SUM(d.amount - COALESCE(r.paid, 0)), 0) AS total
         FROM debts d
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
           ON r.debt_id = d.id
         WHERE d.user_id = $1 AND d.type = 'payable' AND d.status = 'active'
         GROUP BY d.currency`,
        [uid]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM debts
         WHERE user_id = $1 AND status = 'active' AND due_date < NOW()`,
        [uid]
      ),
      pool.query(
        `SELECT d.id, d.amount, d.currency, d.type, d.status, d.due_date, d.created_at,
                c.full_name AS client_name
         FROM debts d
         JOIN clients c ON c.id = d.client_id
         WHERE d.user_id = $1
         ORDER BY d.created_at DESC LIMIT 10`,
        [uid]
      ),
    ]);

    const toByCurrency = (rows) =>
      Object.fromEntries(rows.map((r) => [r.currency, parseFloat(r.total)]));

    res.json({
      receivable:    toByCurrency(receivable.rows),
      payable:       toByCurrency(payable.rows),
      overdue_count: parseInt(overdue.rows[0].count),
      recent_debts:  recent.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats };
