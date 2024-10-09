const Meetings = require('../model/meeting');
const logger = require('../logger');

const generateMeetingLink = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const meetingId = `meeting-${Date.now()}`;
    const meetingLink = `https://chat-and-video.onrender.com/meeting/join/${meetingId}/${userId}`; // Updated link structure

    const meeting = new Meetings({ meetingId, meetingLink, participants: [userId] });

    await meeting.save();
    res.status(201).json({
        message: 'Meeting link generated successfully',
        meetingId,
        meetingLink
    });
};



const createMeeting = async (req, res) => {
    try {
        const { userId } = req.body;
        const meetingId = `${Date.now()}`;
        const meetingLink = `https://chat-and-video.onrender.com/meeting/${meetingId}`; // Ensure this matches your route prefix

        const meeting = new Meetings({
            meetingId,
            meetingLink,
            participants: [userId]
        });

        await meeting.save();
        logger.info(`Meeting created: ${meetingId} by user: ${userId}`);
        res.json({
            message: 'Meeting created successfully',
            meetingId,
            meetingLink
        });
    } catch (error) {
        logger.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Error creating meeting' });
    }
};

const joinMeeting = async (req, res) => {
    try {
        const { meetingId, userId } = req.body;

        const meeting = await Meetings.findOne({ meetingId });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        if (!meeting.participants.includes(userId)) {
            meeting.participants.push(userId);
            await meeting.save();
        }

        logger.info(`User ${userId} joined meeting: ${meetingId}`);
        res.json({ message: `Joined meeting: ${meetingId}` });
    } catch (error) {
        logger.error('Error joining meeting:', error);
        res.status(500).json({ error: 'Error joining meeting' });
    }
};

const leaveMeeting = async (req, res) => {
    try {
        const { meetingId, userId } = req.body;

        const meeting = await Meetings.findOne({ meetingId });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        meeting.participants = meeting.participants.filter(participant => participant !== userId);
        if (meeting.participants.length === 0) {
            await Meetings.deleteOne({ meetingId });
            logger.info(`Meeting ${meetingId} deleted`);
        } else {
            await meeting.save();
        }

        logger.info(`User ${userId} left meeting: ${meetingId}`);
        res.json({ message: `Left meeting: ${meetingId}` });
    } catch (error) {
        logger.error('Error leaving meeting:', error);
        res.status(500).json({ error: 'Error leaving meeting' });
    }
};

const getMeetingDetails = async (req, res) => {
    const { meetingId } = req.params;
    try {
        const meeting = await Meetings.findOne({ meetingId });
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        res.status(200).json(meeting);
    } catch (error) {
        logger.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    generateMeetingLink,
    createMeeting,
    joinMeeting,
    leaveMeeting,
    getMeetingDetails,
};
