const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/appointments — admin sees all, master sees own, user sees own
router.get('/', authenticate, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `
        SELECT a.*, u.name AS client_name, u.phone AS client_phone,
               mu.name AS master_name, s.name AS service_name, s.price
        FROM appointments a
        JOIN users u ON u.id = a.client_id
        JOIN masters m ON m.id = a.master_id
        JOIN users mu ON mu.id = m.user_id
        JOIN services s ON s.id = a.service_id
        ORDER BY a.appt_date DESC, a.appt_time DESC`;
      params = [];
    } else if (req.user.role === 'master') {
      query = `
        SELECT a.*, u.name AS client_name, u.phone AS client_phone,
               s.name AS service_name, s.price
        FROM appointments a
        JOIN users u ON u.id = a.client_id
        JOIN masters m ON m.id = a.master_id
        JOIN services s ON s.id = a.service_id
        WHERE m.user_id = $1
        ORDER BY a.appt_date DESC, a.appt_time DESC`;
      params = [req.user.id];
    } else {
      query = `
        SELECT a.*, mu.name AS master_name, s.name AS service_name, s.price
        FROM appointments a
        JOIN masters m ON m.id = a.master_id
        JOIN users mu ON mu.id = m.user_id
        JOIN services s ON s.id = a.service_id
        WHERE a.client_id = $1
        ORDER BY a.appt_date DESC, a.appt_time DESC`;
      params = [req.user.id];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/appointments — any authenticated user
router.post('/', authenticate, [
  body('master_id').isInt(),
  body('service_id').isInt(),
  body('appt_date').isDate(),
  body('appt_time').matches(/^\d{2}:\d{2}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { master_id, service_id, appt_date, appt_time, notes } = req.body;
  const client_id = req.user.id;

  try {
    // Check slot not taken
    const conflict = await pool.query(
      `SELECT id FROM appointments WHERE master_id=$1 AND appt_date=$2 AND appt_time=$3
       AND status IN ('pending','confirmed')`,
      [master_id, appt_date, appt_time]
    );
    if (conflict.rows.length) return res.status(409).json({ error: 'Бұл уақыт бос емес' });

    const { rows } = await pool.query(
      `INSERT INTO appointments (client_id,master_id,service_id,appt_date,appt_time,notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [client_id, master_id, service_id, appt_date, appt_time, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/appointments/:id/status — master or admin
router.patch('/:id/status', authenticate, authorize('admin','master'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','confirmed','cancelled','completed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Жарамсыз статус' });
  try {
    const { rows } = await pool.query(
      'UPDATE appointments SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Жазба табылмады' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/appointments/:id — client cancels own, admin cancels any
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM appointments WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Жазба табылмады' });
    const appt = rows[0];
    if (req.user.role !== 'admin' && appt.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Рұқсат жоқ' });
    }
    await pool.query("UPDATE appointments SET status='cancelled' WHERE id=$1", [req.params.id]);
    res.json({ message: 'Жазба бас тартылды' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
