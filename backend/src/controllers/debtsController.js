const pool = require('../config/db');

const JOINS = `
  FROM debts d
  JOIN clients c ON c.id = d.client_id
  LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
    ON r.debt_id = d.id`;

const WITH_COMPUTED = `
  SELECT d.*,
    c.full_name AS client_name, c.phone AS client_phone,
    COALESCE(r.paid, 0)::numeric          AS total_paid,
    (d.amount - COALESCE(r.paid, 0))::numeric AS remaining,
    CASE
      WHEN d.status = 'paid'  THEN 'paid'
      WHEN d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE AND d.status != 'paid' THEN 'overdue'
      ELSE 'active'
    END AS computed_status
  ${JOINS}`;

const DEBT_SORT_MAP = {
  amount: 'd.amount',
  date:   'd.created_at',
  name:   'c.full_name',
};

async function list(req, res, next) {
  try {
    const { status, type, kind, search, currency, date_from, date_to, sort, order } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const sortCol = DEBT_SORT_MAP[sort] ?? 'd.created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const params = [req.businessId];
    let whereExtra = '';

    if (type)      { params.push(type);          whereExtra += ` AND d.type = $${params.length}`; }
    if (kind)      { params.push(kind);           whereExtra += ` AND d.kind = $${params.length}`; }
    if (search)    { params.push(`%${search}%`); whereExtra += ` AND c.full_name ILIKE $${params.length}`; }
    if (currency)  { params.push(currency);       whereExtra += ` AND d.currency = $${params.length}`; }
    if (date_from) { params.push(date_from);      whereExtra += ` AND d.created_at >= $${params.length}::date`; }
    if (date_to)   { params.push(date_to);        whereExtra += ` AND d.created_at < ($${params.length}::date + INTERVAL '1 day')`; }

    let statusClause = '';
    if (status === 'paid')    statusClause = ` AND d.status = 'paid'`;
    if (status === 'overdue') statusClause = ` AND d.status != 'paid' AND d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE`;
    if (status === 'active')  statusClause = ` AND d.status != 'paid' AND (d.due_date IS NULL OR d.due_date >= CURRENT_DATE)`;

    const whereClause = `WHERE d.business_id = $1 AND d.deleted_at IS NULL${whereExtra}${statusClause}`;

    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total ${JOINS} ${whereClause}`, params),
      pool.query(
        `${WITH_COMPUTED} ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data:       dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `${WITH_COMPUTED} WHERE d.id = $1 AND d.business_id = $2 AND d.deleted_at IS NULL`,
      [id, req.businessId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { client_id, amount, currency, description, due_date, type, kind, parts_count, first_due_date, interval_days } = req.body;
    if (!client_id || !amount) return res.status(400).json({ error: 'client_id and amount required' });

    const owner = await pool.query(
      `SELECT id FROM clients WHERE id = $1 AND business_id = $2`,
      [client_id, req.businessId]
    );
    if (!owner.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const debtType = type === 'payable' ? 'payable' : 'receivable';
    const debtKind = kind === 'installment' ? 'installment' : 'standard';

    let finalDueDate = due_date || null;
    let pc = 0;
    let interval = 30;
    let startDate = new Date();

    if (debtKind === 'installment') {
      pc = Math.max(2, parseInt(parts_count) || 2);
      interval = Math.max(1, parseInt(interval_days) || 30);
      startDate = first_due_date ? new Date(first_due_date) : new Date();
      const lastDate = new Date(startDate);
      lastDate.setDate(lastDate.getDate() + (pc - 1) * interval);
      finalDueDate = lastDate.toISOString().slice(0, 10);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO debts (user_id, business_id, client_id, amount, currency, description, due_date, type, kind)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [req.user.userId, req.businessId, client_id, amount, currency || 'TJS', description || null, finalDueDate, debtType, debtKind]
      );

      if (debtKind === 'installment') {
        const totalAmt = parseFloat(amount);
        const base = Math.floor((totalAmt * 100) / pc) / 100;
        const last = parseFloat((totalAmt - base * (pc - 1)).toFixed(2));

        for (let i = 0; i < pc; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + i * interval);
          const partAmount = i === pc - 1 ? last : base;
          await client.query(
            `INSERT INTO debt_schedules (debt_id, part_number, amount, due_date) VALUES ($1, $2, $3, $4)`,
            [rows[0].id, i + 1, partAmount, dueDate.toISOString().slice(0, 10)]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

async function getSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const check = await pool.query(
      'SELECT id FROM debts WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
      [id, req.businessId]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Not found' });

    await pool.query(
      `UPDATE debt_schedules SET status = 'overdue'
       WHERE debt_id = $1 AND status = 'pending' AND due_date < CURRENT_DATE`,
      [id]
    );

    const { rows } = await pool.query(
      'SELECT * FROM debt_schedules WHERE debt_id = $1 ORDER BY part_number',
      [id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function payScheduleItem(req, res, next) {
  try {
    const { scheduleId } = req.params;
    const { paid_amount } = req.body;

    const existing = await pool.query(
      `SELECT ds.amount, ds.status FROM debt_schedules ds
       JOIN debts d ON d.id = ds.debt_id
       WHERE ds.id = $1 AND d.business_id = $2`,
      [scheduleId, req.businessId]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });

    const item = existing.rows[0];
    if (item.status === 'paid') return res.status(409).json({ error: 'Already fully paid' });

    const fullAmount = parseFloat(item.amount);
    const paidAmt = paid_amount !== undefined ? parseFloat(paid_amount) : fullAmount;
    if (isNaN(paidAmt) || paidAmt <= 0) return res.status(400).json({ error: 'Invalid paid_amount' });

    const newStatus = paidAmt >= fullAmount ? 'paid' : 'partial';

    const { rows } = await pool.query(
      `UPDATE debt_schedules SET status = $1, paid_at = NOW(), paid_amount = $2 WHERE id = $3 RETURNING *`,
      [newStatus, paidAmt, scheduleId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, currency, description, due_date, status, type } = req.body;

    const { rows } = await pool.query(
      `UPDATE debts SET
         amount      = COALESCE($1, amount),
         currency    = COALESCE($2, currency),
         description = COALESCE($3, description),
         due_date    = COALESCE($4::date, due_date),
         status      = COALESCE($5, status),
         type        = COALESCE($6, type)
       WHERE id = $7 AND business_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [amount || null, currency || null, description ?? null, due_date || null, status || null, type || null, id, req.businessId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      `UPDATE debts SET deleted_at = NOW()
       WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
      [id, req.businessId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

async function exportDebts(req, res, next) {
  try {
    const ExcelJS = require('exceljs');
    const bid = req.businessId;
    const { type, kind, status, search, currency, date_from, date_to, sort, order } = req.query;

    const sortCol = DEBT_SORT_MAP[sort] ?? 'd.created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const params = [bid];
    let whereExtra = '';
    if (type)      { params.push(type);          whereExtra += ` AND d.type = $${params.length}`; }
    if (kind)      { params.push(kind);           whereExtra += ` AND d.kind = $${params.length}`; }
    if (search)    { params.push(`%${search}%`); whereExtra += ` AND c.full_name ILIKE $${params.length}`; }
    if (currency)  { params.push(currency);       whereExtra += ` AND d.currency = $${params.length}`; }
    if (date_from) { params.push(date_from);      whereExtra += ` AND d.created_at >= $${params.length}::date`; }
    if (date_to)   { params.push(date_to);        whereExtra += ` AND d.created_at < ($${params.length}::date + INTERVAL '1 day')`; }

    let statusClause = '';
    if (status === 'paid')    statusClause = ` AND d.status = 'paid'`;
    if (status === 'overdue') statusClause = ` AND d.status != 'paid' AND d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE`;
    if (status === 'active')  statusClause = ` AND d.status != 'paid' AND (d.due_date IS NULL OR d.due_date >= CURRENT_DATE)`;

    const whereClause = `WHERE d.business_id = $1 AND d.deleted_at IS NULL${whereExtra}${statusClause}`;
    const { rows } = await pool.query(
      `${WITH_COMPUTED} ${whereClause} ORDER BY ${sortCol} ${sortDir}`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Daftarcha';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Долги');
    sheet.columns = [
      { header: 'Клиент',        key: 'client_name',  width: 25 },
      { header: 'Телефон',       key: 'phone',         width: 16 },
      { header: 'Тип',           key: 'type_label',    width: 14 },
      { header: 'Сумма',         key: 'amount',        width: 14 },
      { header: 'Валюта',        key: 'currency',      width: 8  },
      { header: 'Статус',        key: 'status_label',  width: 12 },
      { header: 'Дата создания', key: 'created_at',    width: 14 },
      { header: 'Срок оплаты',   key: 'due_date',      width: 13 },
      { header: 'Оплачено',      key: 'total_paid',    width: 14 },
      { header: 'Остаток',       key: 'remaining',     width: 14 },
    ];
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };

    const statusMap = { active: 'Активный', paid: 'Оплачен', overdue: 'Просрочен' };
    for (const row of rows) {
      const sk = row.status === 'paid' ? 'paid'
        : (row.due_date && new Date(row.due_date) < new Date() ? 'overdue' : 'active');
      sheet.addRow({
        client_name:  row.client_name,
        phone:        row.client_phone ?? '',
        type_label:   row.type === 'receivable' ? 'Мне должны' : 'Я должен',
        amount:       parseFloat(row.amount),
        currency:     row.currency,
        status_label: statusMap[sk] ?? sk,
        created_at:   row.created_at ? new Date(row.created_at).toLocaleDateString('ru-RU') : '',
        due_date:     row.due_date ? new Date(row.due_date).toLocaleDateString('ru-RU') : '',
        total_paid:   parseFloat(row.total_paid),
        remaining:    parseFloat(row.remaining),
      });
    }
    ['amount', 'total_paid', 'remaining'].forEach((col) => {
      sheet.getColumn(col).numFmt = '#,##0.00';
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="debts-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.setHeader('Cache-Control', 'no-cache');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, exportDebts, getSchedule, payScheduleItem };
