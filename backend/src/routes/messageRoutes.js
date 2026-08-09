const express = require('express');
const router = express.Router();
const { getMessages, postMessage } = require('../controllers/messageController');

router.get('/', getMessages);
router.post('/', postMessage);

module.exports = router;
