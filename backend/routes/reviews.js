const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/reviews?master_id=X
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT r.*, u.name AS client_name, mu.name AS master_name, s.name AS service_name
      FROM reviews r
      JOIN users u ON u.id = r.client_id
      JOIN masters m ON m.id = r.master_id
      JOIN users mu ON mu.id = m.user_id
      JOIN appointments a ON a.id = r.appointment_id
      JOIN services s ON s.id = a.service_id`;
    const params = [];
    if (req.query.master_id) {
      query += ` WHERE r.master_id=$1`;
      params.push(req.query.master_id);
    }
    query += ` ORDER BY r.created_at DESC LIMIT 50`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reviews
router.post('/', authenticate, [
  body('appointment_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { appointment_id, rating, comment } = req.body;
  try {
    // Verify appointment belongs to user and is completed
    const appt = await pool.query(
      `SELECT * FROM appointments WHERE id=$1 AND client_id=$2 AND status='completed'`,
      [appointment_id, req.user.id]
    );
    if (!appt.rows.length) return res.status(403).json({ error: 'Аяқталған жазбаға ғана пікір қалдыруға болады' });

    const { rows } = await pool.query(
      `INSERT INTO reviews (appointment_id,client_id,master_id,rating,comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [appointment_id, req.user.id, appt.rows[0].master_id, rating, comment]
    );
    // Update master rating
    await pool.query(
      `UPDATE masters SET rating=(SELECT AVG(rating) FROM reviews WHERE master_id=$1) WHERE id=$1`,
      [appt.rows[0].master_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
