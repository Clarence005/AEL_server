const express = require('express');
const { getVideoPlaylist } = require('../controllers/videoController');

const router = express.Router();

router.get('/video.m3u8', getVideoPlaylist);

module.exports = router;
