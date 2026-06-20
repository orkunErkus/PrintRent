const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'printrent-jwt-secret-2024';

function generateToken(user, rememberMe = false) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '24h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Oturum gerekli' });
  }
  try {
    const decoded = verifyToken(header.split(' ')[1]);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Kullanici bulunamadi' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Gecersiz veya sureci dolmus oturum' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Bu islem icin admin yetkisi gerekli' });
  }
  next();
}

module.exports = { generateToken, verifyToken, authMiddleware, adminOnly, JWT_SECRET };
