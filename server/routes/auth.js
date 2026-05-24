const router = require('express').Router()

// GET /auth/google — initiates OAuth (stub)
router.get('/google', (req, res) => {
  res.status(501).json({ message: 'OAuth not yet configured' })
})

// GET /auth/google/callback
router.get('/google/callback', (req, res) => {
  res.status(501).json({ message: 'OAuth not yet configured' })
})

// GET /auth/me
router.get('/me', (req, res) => {
  res.status(501).json({ message: 'Not yet implemented' })
})

module.exports = router
