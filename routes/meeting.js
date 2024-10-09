// const express = require('express');
// const { generateMeetingLink, joinMeeting } = require('../controllers/meetingController');
// const router = express.Router();

// // Route to generate a meeting link
// router.post('/generate', generateMeetingLink);

// // Route to join a meeting
// router.post('/join', joinMeeting);

// module.exports = router;
// models/Meeting.js

// routes/meetingRouter.js
const express = require('express');
const { generateMeetingLink } = require('../controller/meeting');
const meetingController = require('../controller/meeting');

const router = express.Router();

// POST route to generate a new meeting link
router.post('/generate', generateMeetingLink);
router.post('/create', meetingController.createMeeting);
router.post('/join', meetingController.joinMeeting);
router.post('/leave', meetingController.leaveMeeting);

module.exports = router;
