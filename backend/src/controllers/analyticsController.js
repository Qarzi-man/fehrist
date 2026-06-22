const pool = require('../config/db');

async function analytics(req, res, next) {
  try {
    const bid    = req.businessId;
    const months = Math.min(12, Math.max(1, parseInt(req.query.months) || 6));
    const back   = months - 1;

    const [newDebtsRes, repaymentsRes, topClientsRes, summaryRes, repaidMonthRes] = await Promise.all([
      pool.query(
        `SELECT
           to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
           currency, type,
           SUM(amount) AS total
         FROM debts
         WHERE business_id = $1 AND deleted_at IS NULL
           AND created_at >= date_trunc('month', NOW()) - INTERVAL '${back} months'
         GROUP BY 1, 2, 3 ORDER BY 1`,
        [bid]
      ),
      pool.query(
        `SELECT
           to_char(date_trunc('month', r.paid_at), 'YYYY-MM') AS month,
           d.currency,
           SUM(r.amount) AS total
         FROM repayments r
         JOIN debts d ON d.id = r.debt_id
         WHERE d.business_id = $1
           AND r.paid_at >= date_trunc('month', NOW()) - INTERVAL '${back} months'
         GROUP BY 1, 2 ORDER BY 1`,
        [bid]
      ),
      pool.query(
        `SELECT
           c.id AS client_id, c.full_name, d.currency,
           SUM(GREATEST(d.amount - COALESCE(r.paid, 0), 0)) AS remaining
         FROM debts d
         JOIN clients c ON c.id = d.client_id
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
           ON r.debt_id = d.id
         WHERE d.business_id = $1 AND d.status = 'active'
           AND d.deleted_at IS NULL AND c.deleted_at IS NULL
         GROUP BY c.id, c.full_name, d.currency`,
        [bid]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL)        AS total_active,
           COUNT(*) FILTER (WHERE deleted_at IS NULL AND status != 'paid'
             AND due_date IS NOT NULL AND due_date < CURRENT_DATE)                 AS overdue_count
         FROM debts WHERE business_id = $1`,
        [bid]
      ),
      pool.query(
        `SELECT d.currency, SUM(r.amount) AS total
         FROM repayments r
         JOIN debts d ON d.id = r.debt_id
         WHERE d.business_id = $1 AND r.paid_at >= date_trunc('month', NOW())
         GROUP BY d.currency`,
        [bid]
      ),
    ]);

    const monthlyMap = {};
    const now = new Date();
    for (let i = back; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, new_receivable: {}, new_payable: {}, repaid: {} };
    }

    for (const row of newDebtsRes.rows) {
      if (!monthlyMap[row.month]) continue;
      const dest = row.type === 'receivable' ? 'new_receivable' : 'new_payable';
      monthlyMap[row.month][dest][row.currency] =
        (monthlyMap[row.month][dest][row.currency] || 0) + parseFloat(row.total);
    }

    for (const row of repaymentsRes.rows) {
      if (!monthlyMap[row.month]) continue;
      monthlyMap[row.month].repaid[row.currency] =
        (monthlyMap[row.month].repaid[row.currency] || 0) + parseFloat(row.total);
    }

    const clientMap = {};
    for (const row of topClientsRes.rows) {
      if (!clientMap[row.client_id]) {
        clientMap[row.client_id] = {
          client_id:       row.client_id,
          full_name:       row.full_name,
          by_currency:     {},
          total_remaining: 0,
        };
      }
      const val = parseFloat(row.remaining);
      clientMap[row.client_id].by_currency[row.currency] = val;
      clientMap[row.client_id].total_remaining += val;
    }

    const top_clients = Object.values(clientMap)
      .sort((a, b) => b.total_remaining - a.total_remaining)
      .slice(0, 5);

    const s = summaryRes.rows[0];
    const repaid_this_month = Object.fromEntries(
      repaidMonthRes.rows.map((r) => [r.currency, parseFloat(r.total)])
    );

    res.json({
      monthly:     Object.values(monthlyMap),
      top_clients,
      summary: {
        total_active:      parseInt(s.total_active),
        overdue_count:     parseInt(s.overdue_count),
        repaid_this_month,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { analytics };
