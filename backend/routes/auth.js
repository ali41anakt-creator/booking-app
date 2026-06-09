const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Аты-жөні міндетті'),
  body('phone').matches(/^\+7\d{10}$/).withMessage('Телефон форматы: +7XXXXXXXXXX'),
  body('password').isLength({ min: 6 }).withMessage('Кем дегенде 6 символ'),
  body('email').optional().isEmail().withMessage('Email дұрыс емес'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, email, password } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (exists.rows.length) return res.status(409).json({ error: 'Бұл телефон тіркелген' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, phone, email, password, role)
       VALUES ($1,$2,$3,$4,'user') RETURNING id, name, phone, email, role`,
      [name, phone, email || null, hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('phone').notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE phone=$1 AND is_active=TRUE', [phone]);
    if (!rows.length) return res.status(401).json({ error: 'Телефон немесе құпия сөз қате' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Телефон немесе құпия сөз қате' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,phone,email,role,avatar_url,created_at FROM users WHERE id=$1', [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
