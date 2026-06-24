const pool = require('../config/db');

const VALID_PERIODS = ['1d', '1w', '1m', '3m', '6m', '1y'];

const MONTHS_RU  = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DAYS_RU    = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const HOUR_LABELS = ['0:00','6:00','12:00','18:00'];

function periodConfig(p) {
  switch (p) {
    case '1d': return { sinceInterval: '1 day',    chartMode: 'hourly'             };
    case '1w': return { sinceInterval: '7 days',   chartMode: 'daily',  days: 7   };
    case '1m': return { sinceInterval: '30 days',  chartMode: 'daily',  days: 30  };
    case '3m': return { sinceInterval: '3 months', chartMode: 'monthly', back: 2  };
    case '1y': return { sinceInterval: '12 months',chartMode: 'monthly', back: 11 };
    default:   return { sinceInterval: '6 months', chartMode: 'monthly', back: 5  };
  }
}

async function analytics(req, res, next) {
  try {
    const bid    = req.businessId;
    const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : '6m';
    const cfg    = periodConfig(period);

    // Base queries (always run)
    const basePromises = [
      pool.query(
        `SELECT c.id AS client_id, c.full_name, d.currency, d.type,
           SUM(GREATEST(d.amount - COALESCE(r.paid, 0), 0)) AS remaining
         FROM debts d
         JOIN clients c ON c.id = d.client_id
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r ON r.debt_id = d.id
         WHERE d.business_id = $1 AND d.status = 'active' AND d.deleted_at IS NULL AND c.deleted_at IS NULL
         GROUP BY c.id, c.full_name, d.currency, d.type`,
        [bid]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) AS total_active,
           COUNT(*) FILTER (WHERE deleted_at IS NULL AND status != 'paid' AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS overdue_count
         FROM debts WHERE business_id = $1`,
        [bid]
      ),
      pool.query(
        `SELECT d.currency, SUM(r.amount) AS total FROM repayments r JOIN debts d ON d.id = r.debt_id
         WHERE d.business_id = $1 AND r.paid_at >= date_trunc('month', NOW()) GROUP BY d.currency`,
        [bid]
      ),
      pool.query(
        `SELECT d.currency, SUM(r.amount) AS total FROM repayments r JOIN debts d ON d.id = r.debt_id
         WHERE d.business_id = $1 AND r.paid_at >= NOW() - $2::interval GROUP BY d.currency`,
        [bid, cfg.sinceInterval]
      ),
    ];

    // Chart queries
    let chartPromises = [];
    if (cfg.chartMode === 'hourly') {
      chartPromises = [
        pool.query(
          `SELECT FLOOR(EXTRACT(HOUR FROM created_at) / 6)::int AS slot, currency, type, SUM(amount) AS total
           FROM debts WHERE business_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '1 day'
           GROUP BY 1, 2, 3 ORDER BY 1`,
          [bid]
        ),
        pool.query(
          `SELECT FLOOR(EXTRACT(HOUR FROM r.paid_at) / 6)::int AS slot, d.currency, SUM(r.amount) AS total
           FROM repayments r JOIN debts d ON d.id = r.debt_id
           WHERE d.business_id = $1 AND r.paid_at >= NOW() - INTERVAL '1 day'
           GROUP BY 1, 2 ORDER BY 1`,
          [bid]
        ),
      ];
    } else if (cfg.chartMode === 'daily') {
      chartPromises = [
        pool.query(
          `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, currency, type, SUM(amount) AS total
           FROM debts WHERE business_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${cfg.sinceInterval}'
           GROUP BY 1, 2, 3 ORDER BY 1`,
          [bid]
        ),
        pool.query(
          `SELECT to_char(r.paid_at::date, 'YYYY-MM-DD') AS day, d.currency, SUM(r.amount) AS total
           FROM repayments r JOIN debts d ON d.id = r.debt_id
           WHERE d.business_id = $1 AND r.paid_at >= NOW() - INTERVAL '${cfg.sinceInterval}'
           GROUP BY 1, 2 ORDER BY 1`,
          [bid]
        ),
      ];
    } else {
      const back = cfg.back;
      chartPromises = [
        pool.query(
          `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, currency, type, SUM(amount) AS total
           FROM debts WHERE business_id = $1 AND deleted_at IS NULL
             AND created_at >= date_trunc('month', NOW()) - INTERVAL '${back} months'
           GROUP BY 1, 2, 3 ORDER BY 1`,
          [bid]
        ),
        pool.query(
          `SELECT to_char(date_trunc('month', r.paid_at), 'YYYY-MM') AS month, d.currency, SUM(r.amount) AS total
           FROM repayments r JOIN debts d ON d.id = r.debt_id
           WHERE d.business_id = $1 AND r.paid_at >= date_trunc('month', NOW()) - INTERVAL '${back} months'
           GROUP BY 1, 2 ORDER BY 1`,
          [bid]
        ),
      ];
    }

    const results = await Promise.all([...basePromises, ...chartPromises]);
    const [topClientsRes, summaryRes, repaidMonthRes, repaidPeriodRes, chart1Res, chart2Res] = results;

    // Build top clients
    const clientMap = {};
    for (const row of topClientsRes.rows) {
      if (!clientMap[row.client_id]) {
        clientMap[row.client_id] = { client_id: row.client_id, full_name: row.full_name, by_currency: {}, debts: [], total_remaining: 0 };
      }
      const val = parseFloat(row.remaining);
      clientMap[row.client_id].by_currency[row.currency] = (clientMap[row.client_id].by_currency[row.currency] || 0) + val;
      clientMap[row.client_id].debts.push({ currency: row.currency, type: row.type, amount: val });
      clientMap[row.client_id].total_remaining += val;
    }
    const top_clients = Object.values(clientMap).sort((a, b) => b.total_remaining - a.total_remaining).slice(0, 5);

    // Build chart data
    let monthly = [];
    if (cfg.chartMode === 'hourly') {
      const slots = {};
      for (let i = 0; i < 4; i++) {
        slots[i] = { label: HOUR_LABELS[i], new_receivable: {}, new_payable: {}, repaid: {} };
      }
      for (const row of chart1Res.rows) {
        const s = slots[row.slot];
        if (s) { const dest = row.type === 'receivable' ? 'new_receivable' : 'new_payable'; s[dest][row.currency] = (s[dest][row.currency] || 0) + parseFloat(row.total); }
      }
      for (const row of chart2Res.rows) {
        const s = slots[row.slot];
        if (s) { s.repaid[row.currency] = (s.repaid[row.currency] || 0) + parseFloat(row.total); }
      }
      monthly = Object.values(slots);

    } else if (cfg.chartMode === 'daily') {
      const days = {};
      const now  = new Date();
      const isWeekly = period === '1w';
      for (let i = cfg.days - 1; i >= 0; i--) {
        const d   = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = isWeekly
          ? DAYS_RU[d.getDay()]
          : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
        days[key] = { label, new_receivable: {}, new_payable: {}, repaid: {} };
      }
      for (const row of chart1Res.rows) {
        const entry = days[row.day];
        if (entry) { const dest = row.type === 'receivable' ? 'new_receivable' : 'new_payable'; entry[dest][row.currency] = (entry[dest][row.currency] || 0) + parseFloat(row.total); }
      }
      for (const row of chart2Res.rows) {
        const entry = days[row.day];
        if (entry) { entry.repaid[row.currency] = (entry.repaid[row.currency] || 0) + parseFloat(row.total); }
      }
      monthly = Object.values(days);

    } else {
      const back = cfg.back;
      const monthlyMap = {};
      const now = new Date();
      for (let i = back; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = { label: MONTHS_RU[d.getMonth()], new_receivable: {}, new_payable: {}, repaid: {} };
      }
      for (const row of chart1Res.rows) {
        if (!monthlyMap[row.month]) continue;
        const dest = row.type === 'receivable' ? 'new_receivable' : 'new_payable';
        monthlyMap[row.month][dest][row.currency] = (monthlyMap[row.month][dest][row.currency] || 0) + parseFloat(row.total);
      }
      for (const row of chart2Res.rows) {
        if (!monthlyMap[row.month]) continue;
        monthlyMap[row.month].repaid[row.currency] = (monthlyMap[row.month].repaid[row.currency] || 0) + parseFloat(row.total);
      }
      monthly = Object.values(monthlyMap);
    }

    const s = summaryRes.rows[0];
    const repaid_this_month = Object.fromEntries(repaidMonthRes.rows.map((r) => [r.currency, parseFloat(r.total)]));
    const repaid_in_period  = Object.fromEntries(repaidPeriodRes.rows.map((r) => [r.currency, parseFloat(r.total)]));

    res.json({
      monthly,
      top_clients,
      summary: {
        total_active:      parseInt(s.total_active),
        overdue_count:     parseInt(s.overdue_count),
        repaid_this_month,
        repaid_in_period,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function exportAnalytics(req, res, next) {
  try {
    const ExcelJS = require('exceljs');
    const bid    = req.businessId;
    const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : '6m';
    const cfg    = periodConfig(period);
    const back   = cfg.chartMode === 'monthly' ? cfg.back : 0;

    const [newDebtsRes, repaymentsRes, topClientsRes, summaryRes, repaidMonthRes] = await Promise.all([
      pool.query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                currency, type, SUM(amount) AS total
         FROM debts WHERE business_id = $1 AND deleted_at IS NULL
           AND created_at >= date_trunc('month', NOW()) - INTERVAL '${back} months'
         GROUP BY 1, 2, 3 ORDER BY 1`, [bid]),
      pool.query(
        `SELECT to_char(date_trunc('month', r.paid_at), 'YYYY-MM') AS month,
                d.currency, SUM(r.amount) AS total
         FROM repayments r JOIN debts d ON d.id = r.debt_id
         WHERE d.business_id = $1
           AND r.paid_at >= date_trunc('month', NOW()) - INTERVAL '${back} months'
         GROUP BY 1, 2 ORDER BY 1`, [bid]),
      pool.query(
        `SELECT c.id AS client_id, c.full_name, d.currency, d.type,
                SUM(GREATEST(d.amount - COALESCE(r.paid, 0), 0)) AS remaining
         FROM debts d JOIN clients c ON c.id = d.client_id
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r ON r.debt_id = d.id
         WHERE d.business_id = $1 AND d.status = 'active' AND d.deleted_at IS NULL AND c.deleted_at IS NULL
         GROUP BY c.id, c.full_name, d.currency, d.type`, [bid]),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) AS total_active,
                COUNT(*) FILTER (WHERE deleted_at IS NULL AND status != 'paid'
                  AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS overdue_count
         FROM debts WHERE business_id = $1`, [bid]),
      pool.query(
        `SELECT d.currency, SUM(r.amount) AS total FROM repayments r JOIN debts d ON d.id = r.debt_id
         WHERE d.business_id = $1 AND r.paid_at >= date_trunc('month', NOW())
         GROUP BY d.currency`, [bid]),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Daftarcha';
    workbook.created = new Date();

    const monthlySheet = workbook.addWorksheet('По месяцам');
    monthlySheet.columns = [
      { header: 'Месяц',         key: 'month',  width: 10 },
      { header: 'Валюта',        key: 'cur',    width: 8  },
      { header: 'Новые (мне)',   key: 'recv',   width: 16 },
      { header: 'Новые (я дол.)',key: 'pabl',   width: 18 },
      { header: 'Погашено',      key: 'rpd',    width: 14 },
    ];
    monthlySheet.getRow(1).font = { bold: true };
    monthlySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };

    const monthlyMap = {};
    const now = new Date();
    for (let i = back; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { recv: {}, pabl: {}, rpd: {} };
    }
    for (const row of newDebtsRes.rows) {
      if (!monthlyMap[row.month]) continue;
      const dest = row.type === 'receivable' ? 'recv' : 'pabl';
      monthlyMap[row.month][dest][row.currency] = (monthlyMap[row.month][dest][row.currency] || 0) + parseFloat(row.total);
    }
    for (const row of repaymentsRes.rows) {
      if (!monthlyMap[row.month]) continue;
      monthlyMap[row.month].rpd[row.currency] = (monthlyMap[row.month].rpd[row.currency] || 0) + parseFloat(row.total);
    }
    for (const [month, vals] of Object.entries(monthlyMap)) {
      const currencies = new Set([...Object.keys(vals.recv), ...Object.keys(vals.pabl), ...Object.keys(vals.rpd)]);
      if (!currencies.size) {
        monthlySheet.addRow({ month, cur: '', recv: 0, pabl: 0, rpd: 0 });
      } else {
        for (const cur of currencies) {
          monthlySheet.addRow({ month, cur, recv: vals.recv[cur] || 0, pabl: vals.pabl[cur] || 0, rpd: vals.rpd[cur] || 0 });
        }
      }
    }
    ['recv', 'pabl', 'rpd'].forEach((col) => { monthlySheet.getColumn(col).numFmt = '#,##0.00'; });

    const clientSheet = workbook.addWorksheet('Топ клиентов');
    clientSheet.columns = [
      { header: 'Клиент',  key: 'name',   width: 25 },
      { header: 'Тип',     key: 'type',   width: 14 },
      { header: 'Остаток', key: 'amount', width: 16 },
      { header: 'Валюта',  key: 'cur',    width: 8  },
    ];
    clientSheet.getRow(1).font = { bold: true };
    clientSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };
    const clientMap = {};
    for (const row of topClientsRes.rows) {
      if (!clientMap[row.client_id]) clientMap[row.client_id] = { name: row.full_name, debts: [], total_remaining: 0 };
      const val = parseFloat(row.remaining);
      clientMap[row.client_id].debts.push({ cur: row.currency, type: row.type === 'receivable' ? 'Мне должны' : 'Я должен', amount: val });
      clientMap[row.client_id].total_remaining += val;
    }
    const topClients = Object.values(clientMap).sort((a, b) => b.total_remaining - a.total_remaining).slice(0, 10);
    for (const c of topClients) {
      for (const d of c.debts) {
        clientSheet.addRow({ name: c.name, type: d.type, amount: d.amount, cur: d.cur });
      }
    }
    clientSheet.getColumn('amount').numFmt = '#,##0.00';

    const summarySheet = workbook.addWorksheet('Сводка');
    summarySheet.columns = [
      { header: 'Показатель', key: 'label', width: 30 },
      { header: 'Значение',   key: 'value', width: 16 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    const s = summaryRes.rows[0];
    summarySheet.addRow({ label: `Период`,           value: period });
    summarySheet.addRow({ label: 'Активных долгов',  value: parseInt(s.total_active) });
    summarySheet.addRow({ label: 'Просроченных',     value: parseInt(s.overdue_count) });
    for (const row of repaidMonthRes.rows) {
      summarySheet.addRow({ label: `Погашено за месяц (${row.currency})`, value: parseFloat(row.total) });
    }
    summarySheet.getColumn('value').numFmt = '#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${period}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.setHeader('Cache-Control', 'no-cache');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { analytics, exportAnalytics };
