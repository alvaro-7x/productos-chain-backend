
const { Router } = require('express');
const router = Router();

const { login } = require('../controllers/auth.controller');

// Auth
router.post('/login', [], login);
router.get('/verificar-token', [], login);

module.exports = router;
