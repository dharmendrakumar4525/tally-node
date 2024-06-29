const express = require('express');
const router = express.Router();
const godownController = require('../controllers/godownController');

// Define routes
router.post('/godowns', godownController.upsertGodowns);

module.exports = router;
