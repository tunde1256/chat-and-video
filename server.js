require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors'); // Import cors package
const logger = require('./logger'); // Import the logger
const db = require('./db/db');
const app = express();
const port = process.env.PORT || 3000;
const userRoutes = require('./routes/userRouter');
const AdminRoutes = require('./routes/adminRouter');

// Enable CORS for all routes, including localhost
app.use(cors());

// Middleware to log requests using morgan with Winston stream
app.use(morgan('combined', { stream: logger.stream }));

// Middleware to parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to parse JSON request bodies
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/admin', AdminRoutes);

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Create a WebSocket server, tied to the HTTP server
const wss = new WebSocket.Server({ server });

// Store clients in a Map to identify them by user ID or a unique identifier
const clients = new Map();
// Store meeting participants
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
                // Use localhost for development
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

            case 'dm':
                logger.info(`Received DM from ${userId} to ${recipientId}: ${text}`);
                const recipientSocket = clients.get(recipientId);
                if (recipientSocket) {
                    recipientSocket.send(JSON.stringify({ type: 'dm', from: userId, text }));
                    ws.send('DM sent successfully');
                } else {
                    ws.send('Recipient not connected');
                }
                break;

            case 'forum':
                logger.info(`Received forum message from ${userId}: ${text}`);
                clients.forEach((clientSocket) => {
                    if (clientSocket !== ws) {
                        clientSocket.send(JSON.stringify({ type: 'forum', from: userId, text }));
                    }
                });
                ws.send('Forum message sent successfully');
                break;

            case 'videoCall':
                logger.info(`Video call signal from ${userId} in meeting ${meetingId}`);
                if (meetings.has(meetingId)) {
                    meetings.get(meetingId).forEach(participantId => {
                        const participantSocket = clients.get(participantId);
                        if (participantSocket) {
                            participantSocket.send(JSON.stringify({ type: 'videoCall', from: userId, signalData }));
                        }
                    });
                } else {
                    ws.send('Meeting not found');
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
