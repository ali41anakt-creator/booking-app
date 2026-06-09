const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/masters — list with services (JOIN)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.id, u.name, u.phone, u.email, u.avatar_url,
             m.bio, m.experience, m.rating,
             json_agg(json_build_object('id',s.id,'name',s.name,'price',s.price,'duration_min',s.duration_min))
               FILTER (WHERE s.id IS NOT NULL) AS services
      FROM masters m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN master_services ms ON ms.master_id = m.id
      LEFT JOIN services s ON s.id = ms.service_id AND s.is_active = TRUE
      WHERE u.is_active = TRUE
      GROUP BY m.id, u.name, u.phone, u.email, u.avatar_url, m.bio, m.experience, m.rating
      ORDER BY m.rating DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/masters/:id/schedule?date=YYYY-MM-DD
router.get('/:id/schedule', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Күн параметрі қажет' });
  try {
    const { rows } = await pool.query(`
      SELECT appt_time, status FROM appointments
      WHERE master_id=$1 AND appt_date=$2 AND status IN ('pending','confirmed')
      ORDER BY appt_time`,
      [req.params.id, date]
    );
    // Generate all slots 09:00–19:00 with 30 min intervals
    const slots = [];
    for (let h = 9; h < 19; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const booked = rows.some(r => r.appt_time.slice(0,5) === time);
        slots.push({ time, available: !booked });
      }
    }
    res.json(slots);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/masters/:id/services — master adds service (admin or self)
router.post('/:id/services', authenticate, authorize('admin','master'), async (req, res) => {
  const { service_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO master_services(master_id,service_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, service_id]
    );
    res.json({ message: 'Қызмет қосылды' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
