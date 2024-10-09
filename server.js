require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const logger = require('./logger'); // Assuming you have a logger setup
const db = require('./db/db'); // Assuming you have your database setup
const userRoutes = require('./routes/userRouter');
const adminRoutes = require('./routes/adminRouter');
const meetingRoutes = require('./routes/meeting'); // Import meeting routes

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes, including localhost
app.use(cors());

// Middleware to log requests using morgan with Winston stream
app.use(morgan('combined', { stream: logger.stream }));

// Middleware to parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to parse JSON request bodies
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meeting', meetingRoutes); // Add meeting routes

// Serve static HTML file for video calls
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // Serve the HTML page
});

// Create an HTTP server from the Express app
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocket.Server({ server });

const clients = new Map();
const meetings = new Map();

wss.on('connection', (ws) => {
    logger.info('New client connected via WebSocket');

    ws.on('message', (message) => {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);  // Parsing as JSON
        } catch (err) {
            ws.send('Invalid message format');
            return;
        }

        const { type, userId, recipientId, meetingId, text, signalData } = parsedMessage;

        switch (type) {
            case 'register':
                clients.set(userId, ws);
                ws.userId = userId;
                logger.info(`User registered: ${userId}`);
                ws.send('You are now registered for direct messaging');
                break;

            case 'createMeeting':
                const newMeetingId = `meeting-${Date.now()}`;
                meetings.set(newMeetingId, new Set([userId]));
                ws.send(`meetingCreated:${newMeetingId}:https://chat-and-video.onrender.com/meeting/${newMeetingId}`);
                break;

            case 'joinMeeting':
                logger.info(`${userId} is joining meeting: ${meetingId}`);
                if (!meetings.has(meetingId)) {
                    meetings.set(meetingId, new Set());
                }
                meetings.get(meetingId).add(userId);
                ws.send(`Joined meeting: ${meetingId}`);
                break;

            case 'leaveMeeting':
                logger.info(`${userId} is leaving meeting: ${meetingId}`);
                if (meetings.has(meetingId)) {
                    meetings.get(meetingId).delete(userId);
                    if (meetings.get(meetingId).size === 0) {
                        meetings.delete(meetingId); // Remove meeting if no participants are left
                    }
                }
                ws.send(`Left meeting: ${meetingId}`);
                break;

            case 'webrtcOffer':
                logger.info(`Received WebRTC offer from ${userId} for meeting ${meetingId}`);
                if (meetings.has(meetingId)) {
                    meetings.get(meetingId).forEach(participantId => {
                        if (participantId !== userId) {
                            const participantSocket = clients.get(participantId);
                            if (participantSocket) {
                                participantSocket.send(JSON.stringify({ type: 'webrtcOffer', from: userId, signalData }));
                            }
                        }
                    });
                } else {
                    ws.send('Meeting not found');
                }
                break;

            case 'webrtcAnswer':
                logger.info(`Received WebRTC answer from ${userId} for meeting ${meetingId}`);
                if (meetings.has(meetingId)) {
                    meetings.get(meetingId).forEach(participantId => {
                        if (participantId !== userId) {
                            const participantSocket = clients.get(participantId);
                            if (participantSocket) {
                                participantSocket.send(JSON.stringify({ type: 'webrtcAnswer', from: userId, signalData }));
                            }
                        }
                    });
                } else {
                    ws.send('Meeting not found');
                }
                break;

            case 'webrtcCandidate':
                logger.info(`Received WebRTC candidate from ${userId} for meeting ${meetingId}`);
                if (meetings.has(meetingId)) {
                    meetings.get(meetingId).forEach(participantId => {
                        if (participantId !== userId) {
                            const participantSocket = clients.get(participantId);
                            if (participantSocket) {
                                participantSocket.send(JSON.stringify({ type: 'webrtcCandidate', from: userId, signalData }));
                            }
                        }
                    });
                } else {
                    ws.send('Meeting not found');
                }
                break;

            // Add the new case for direct messaging
            case 'sendMessage':
                logger.info(`Direct message from ${userId} to ${recipientId}: ${text}`);
                const recipientSocket = clients.get(recipientId);
                if (recipientSocket) {
                    recipientSocket.send(JSON.stringify({
                        type: 'receiveMessage',
                        from: userId,
                        text: text,
                    }));
                } else {
                    ws.send(`User ${recipientId} not found`);
                }
                break;

            default:
                ws.send('Unknown message type');
        }
    });

    ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${ws.userId}`);
        clients.delete(ws.userId);

        meetings.forEach((participants, meetingId) => {
            if (participants.delete(ws.userId) && participants.size === 0) {
                meetings.delete(meetingId);
            }
        });
    });

    ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error.message}`);
    });
});

// Start both the Express and WebSocket server
server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
    logger.info(`WebSocket server is running on ws://localhost:${port}`);
});
