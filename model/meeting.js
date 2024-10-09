// // const mongoose = require('mongoose');

// // // Define the meeting schema
// // // const meetingSchema = new mongoose.Schema({
// // //     meetingId: {
// // //         type: String,
// // //         required: true,
// // //         unique: true,
// // //     },
// // //     createdBy: {
// // //         type: String,
// // //         required: true,
// // //     },
// // //     participants: {
// // //         type: [String], // Array of user IDs
// // //         default: [],
// // //     },
// // //     createdAt: {
// // //         type: Date,
// // //         default: Date.now,
// // //     },
// // // });

// // // // Create and export the meeting model
// // // const Meeting = mongoose.model('Meeting', meetingSchema);
// // // module.exports = Meeting;
// // // models/Meeting.js
// // class Meeting {
// //     constructor(userId) {
// //         this.meetingId = `meeting-${Date.now()}`;
// //         this.meetingLink = `https://chat-and-video.onrender.com/meeting/${this.meetingId}`;
// //         this.userId = userId;
// //     }
// // }

// // module.exports = Meeting;
// // models/Meeting.js
// const mongoose = require('mongoose');

// const meetingSchema = new mongoose.Schema({
//     meetingId: { type: String, required: true, unique: true },
//     participants: { type: [String], default: [] },  // Array of user IDs
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Meeting', meetingSchema);
// models/Meeting.js
// models/Meeting.js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    meetingId: { type: String, required: true, unique: true },
    meetingLink: { type: String, required: true },  // Store the meeting link
    participants: { type: [String], default: [] },  // Array of user IDs
    createdAt: { type: Date, default: Date.now }
});

const MeetingModel = mongoose.model('Meeting', meetingSchema);

module.exports = MeetingModel;
