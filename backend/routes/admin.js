const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/admin/stats — dashboard stats
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [total, today, revenue, topMaster] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM appointments WHERE status != 'cancelled'`),
      pool.query(`SELECT COUNT(*) FROM appointments WHERE appt_date=CURRENT_DATE`),
      pool.query(`SELECT COALESCE(SUM(s.price),0) AS total
                  FROM appointments a JOIN services s ON s.id=a.service_id
                  WHERE a.status='completed'`),
      pool.query(`SELECT u.name, COUNT(a.id) AS count
                  FROM appointments a JOIN masters m ON m.id=a.master_id
                  JOIN users u ON u.id=m.user_id
                  WHERE a.status='completed'
                  GROUP BY u.name ORDER BY count DESC LIMIT 1`),
    ]);
    res.json({
      total_appointments: parseInt(total.rows[0].count),
      today_appointments: parseInt(today.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      top_master: topMaster.rows[0] || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/users — all users
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,phone,email,role,is_active,created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/users/:id — change role or active status
router.patch('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  const { role, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role=COALESCE($1,role), is_active=COALESCE($2,is_active)
       WHERE id=$3 RETURNING id,name,phone,email,role,is_active`,
      [role, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пайдаланушы табылмады' });

    // If promoted to master, create master record
    if (role === 'master') {
      await pool.query(
        'INSERT INTO masters(user_id) VALUES($1) ON CONFLICT DO NOTHING',
        [req.params.id]
      );
    }
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
