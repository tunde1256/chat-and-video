const express = require('express');
const {
    generateMeetingLink,
    createMeeting,
    joinMeeting,
    leaveMeeting,
    getMeetingDetails,
} = require('../controller/meeting');

const router = express.Router();

router.post('/generate-link', generateMeetingLink);
router.post('/create', createMeeting);
router.post('/join', joinMeeting);
router.post('/leave', leaveMeeting);
router.get('/:meetingId', getMeetingDetails); // Correctly mapped to get meeting details

module.exports = router;
