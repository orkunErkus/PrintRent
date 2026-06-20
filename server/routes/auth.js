const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Kullanici adi ve sifre gerekli' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, error: 'Sifre en az 4 karakter olmalidir' });
    }
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Bu kullanici adi zaten mevcut' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, role: role || 'user' });
    const token = generateToken(user, false);
    res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, role: user.role } }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Kullanici adi ve sifre gerekli' });
    }
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Hatali kullanici adi veya sifre' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Hatali kullanici adi veya sifre' });
    }
    const token = generateToken(user, !!rememberMe);
    res.json({
      success: true,
      data: { token, user: { id: user.id, username: user.username, role: user.role } }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
