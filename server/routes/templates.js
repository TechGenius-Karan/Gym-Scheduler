const router = require('express').Router()

// GET /api/templates
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Not yet implemented' })
})

// GET /api/templates/:id
router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Not yet implemented' })
})

module.exports = router
