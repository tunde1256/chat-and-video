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

// Enable CORS for all routes
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

    // Handle registration of users
    ws.on('message', (message) => {
        // Convert message to string format
        const parsedMessage = message.toString();

        // Check if the message is a registration message
        if (parsedMessage.startsWith('register:')) {
            const userId = parsedMessage.split(':')[1];

            // Store the socket connection for the user
            clients.set(userId, ws);
            ws.userId = userId; // Store the userId on the WebSocket connection for later use
            logger.info(`User registered: ${userId}`);
            ws.send('You are now registered for direct messaging');
        } else if (parsedMessage.startsWith('joinMeeting:')) {
            const [_, userId, meetingId] = parsedMessage.split(':');
            logger.info(`${userId} is joining meeting: ${meetingId}`);

            // Add user to the meeting
            if (!meetings.has(meetingId)) {
                meetings.set(meetingId, new Set());
            }
            meetings.get(meetingId).add(userId);
            ws.send(`Joined meeting: ${meetingId}`);
        } else if (parsedMessage.startsWith('leaveMeeting:')) {
            const [_, userId, meetingId] = parsedMessage.split(':');
            logger.info(`${userId} is leaving meeting: ${meetingId}`);

            // Remove user from the meeting
            if (meetings.has(meetingId)) {
                meetings.get(meetingId).delete(userId);
                if (meetings.get(meetingId).size === 0) {
                    meetings.delete(meetingId); // Remove meeting if no participants are left
                }
            }
            ws.send(`Left meeting: ${meetingId}`);
        } else if (parsedMessage.startsWith('dm:')) {
            // Handle direct messages
            const [_, senderId, recipientId, text] = parsedMessage.split(':');
            logger.info(`Received DM from ${senderId} to ${recipientId}: ${text}`);

            // Check if recipient is connected
            const recipientSocket = clients.get(recipientId);
            if (recipientSocket) {
                // Send the message to the recipient
                recipientSocket.send(`dm:${senderId}:${text}`);
                ws.send('DM sent successfully');
            } else {
                ws.send('Recipient not connected');
            }
        } else if (parsedMessage.startsWith('forum:')) {
            // Handle forum messages (broadcast to all connected clients)
            const [_, senderId, text] = parsedMessage.split(':');
            logger.info(`Received forum message from ${senderId}: ${text}`);

            // Broadcast the message to all connected clients
            clients.forEach((clientSocket, userId) => {
                if (clientSocket !== ws) { // Don't send back to the sender
                    clientSocket.send(`forum:${senderId}:${text}`);
                }
            });
            ws.send('Forum message sent successfully');
        } else if (parsedMessage.startsWith('videoCall:')) {
            // Handle video call signaling
            const [_, senderId, meetingId, signalData] = parsedMessage.split(':');
            logger.info(`Video call signal from ${senderId} in meeting ${meetingId}`);

            // Notify all participants in the meeting
            if (meetings.has(meetingId)) {
                meetings.get(meetingId).forEach(participantId => {
                    const participantSocket = clients.get(participantId);
                    if (participantSocket) {
                        participantSocket.send(`videoCall:${senderId}:${signalData}`);
                    }
                });
            } else {
                ws.send('Meeting not found');
            }
        } else {
            // Handle unknown messages
            ws.send('Unknown message type');
        }
    });

    // Handle when a client disconnects
    ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${ws.userId}`);
        // Remove the client from the clients map when they disconnect
        clients.delete(ws.userId);
        
        // Remove user from all meetings
        meetings.forEach((participants, meetingId) => {
            if (participants.delete(ws.userId) && participants.size === 0) {
                meetings.delete(meetingId); // Remove meeting if no participants are left
            }
        });
    });
});

// Start both the Express and WebSocket server
server.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
    logger.info(`WebSocket server is running on ws://localhost:${port}`);
});
