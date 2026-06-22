const pool = require('../config/db');
const { sendSms } = require('../services/smsService');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT bm.id, bm.role, bm.status, bm.created_at,
             u.full_name,
             COALESCE(u.phone, bm.phone) AS phone
      FROM business_members bm
      LEFT JOIN users u ON u.id = bm.user_id
      WHERE bm.business_id = $1
      ORDER BY bm.created_at
    `, [req.businessId]);
    res.json(rows);
  } catch (err) { next(err); }
}

async function listPending(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT bm.id, bm.business_id, bm.role, bm.status, bm.created_at,
             b.name AS business_name,
             inv.full_name AS invited_by_name
      FROM business_members bm
      JOIN businesses b ON b.id = bm.business_id
      LEFT JOIN users inv ON inv.id = bm.invited_by
      WHERE bm.user_id = $1 AND bm.status = 'pending'
      ORDER BY bm.created_at DESC
    `, [req.user.userId]);
    res.json(rows);
  } catch (err) { next(err); }
}

async function invite(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const trimmed = phone.trim();

    // Check member limit
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM business_members WHERE business_id = $1 AND status != 'declined'",
      [req.businessId]
    );
    if (parseInt(countRes.rows[0].count) >= 3) {
      return res.status(409).json({ error: 'Member limit reached (max 3)' });
    }

    const bizRes = await pool.query('SELECT name FROM businesses WHERE id = $1', [req.businessId]);
    const bizName = bizRes.rows[0]?.name ?? 'Daftarcha';

    // Look up user by phone
    const userRes = await pool.query('SELECT id, full_name FROM users WHERE phone = $1', [trimmed]);

    let row;

    if (userRes.rows.length) {
      // --- Path A: user already registered ---
      const target = userRes.rows[0];
      if (target.id === req.user.userId) {
        return res.status(400).json({ error: 'Cannot invite yourself' });
      }

      const { rows } = await pool.query(`
        INSERT INTO business_members (business_id, user_id, phone, role, invited_by, status)
        VALUES ($1, $2, $3, 'employee', $4, 'pending')
        ON CONFLICT (business_id, user_id) DO UPDATE SET status = 'pending', invited_by = $4
        RETURNING *
      `, [req.businessId, target.id, trimmed, req.user.userId]);
      row = { ...rows[0], full_name: target.full_name };

      try {
        const smsResult = await sendSms(trimmed, `Вас пригласили в бизнес "${bizName}" в Daftarcha. Войдите в приложение чтобы принять приглашение.`);
        console.log('[Members/invite] SMS result (registered):', JSON.stringify(smsResult));
      } catch (smsErr) {
        console.error('[Members/invite] SMS error (registered):', smsErr.message, smsErr.code);
      }
    } else {
      // --- Path B: user not registered yet ---
      // Upsert by (business_id, phone) for unregistered invites
      const existing = await pool.query(
        'SELECT id FROM business_members WHERE business_id = $1 AND phone = $2 AND user_id IS NULL',
        [req.businessId, trimmed]
      );

      if (existing.rows.length) {
        const { rows } = await pool.query(`
          UPDATE business_members SET status = 'pending', invited_by = $1
          WHERE business_id = $2 AND phone = $3 AND user_id IS NULL
          RETURNING *
        `, [req.user.userId, req.businessId, trimmed]);
        row = rows[0];
      } else {
        const { rows } = await pool.query(`
          INSERT INTO business_members (business_id, user_id, phone, role, invited_by, status)
          VALUES ($1, NULL, $2, 'employee', $3, 'pending')
          RETURNING *
        `, [req.businessId, trimmed, req.user.userId]);
        row = rows[0];
      }

      console.log(`[Members/invite] Sending SMS to unregistered phone=${trimmed.replace(/^\+/, '')}`);
      try {
        const smsResult = await sendSms(trimmed, `Вас пригласили в бизнес "${bizName}". Зарегистрируйтесь в Daftarcha: daftarcha.tj`);
        console.log('[Members/invite] SMS result (unregistered):', JSON.stringify(smsResult));
      } catch (smsErr) {
        console.error('[Members/invite] SMS error (unregistered):', smsErr.message, smsErr.code);
      }
    }

    res.status(201).json({ ...row, phone: trimmed });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already invited' });
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { rows } = await pool.query(`
      UPDATE business_members SET status = 'active'
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
      RETURNING *
    `, [id, req.user.userId]);
    if (!rows.length) return res.status(404).json({ error: 'Invitation not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function decline(req, res, next) {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { rowCount } = await pool.query(`
      DELETE FROM business_members WHERE id = $1 AND user_id = $2 AND status = 'pending'
    `, [id, req.user.userId]);
    if (!rowCount) return res.status(404).json({ error: 'Invitation not found' });
    res.json({ message: 'Declined' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM business_members WHERE id = $1 AND business_id = $2',
      [id, req.businessId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Removed' });
  } catch (err) { next(err); }
}

module.exports = { list, listPending, invite, accept, decline, remove };
