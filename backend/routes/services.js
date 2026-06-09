const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/services — public
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services WHERE is_active=TRUE ORDER BY category,name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Қызмет табылмады' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/services — admin only
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('duration_min').isInt({ min: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description, duration_min, price, category } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO services (name,description,duration_min,price,category)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, description, duration_min, price, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/services/:id — admin only
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { name, description, duration_min, price, category, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE services SET name=COALESCE($1,name), description=COALESCE($2,description),
       duration_min=COALESCE($3,duration_min), price=COALESCE($4,price),
       category=COALESCE($5,category), is_active=COALESCE($6,is_active)
       WHERE id=$7 RETURNING *`,
      [name, description, duration_min, price, category, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Қызмет табылмады' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/services/:id — admin only (soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE services SET is_active=FALSE WHERE id=$1', [req.params.id]);
    res.json({ message: 'Қызмет өшірілді' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
