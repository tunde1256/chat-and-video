import React, { useEffect, useState } from 'react';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [userId, setUserId] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Create WebSocket connection
        const socket = new WebSocket('ws://localhost:3000');

        // Set up WebSocket event handlers
        socket.onopen = () => {
            console.log('Connected to WebSocket server');
            // Register the user (you can modify this to take input)
            socket.send(`register:${userId}`);
        };

        socket.onmessage = (event) => {
            const { data } = event;
            const [type, senderId, text] = data.split(':');

            if (type === 'forum') {
                // Add forum message to the list
                setMessages((prev) => [...prev, `${senderId}: ${text}`]);
            } else if (type === 'dm') {
                // Handle direct messages (optional)
                setMessages((prev) => [...prev, `DM from ${senderId}: ${text}`]);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        // Clean up the WebSocket connection on unmount
        return () => {
            socket.close();
        };
    }, [userId]); // Rerun effect when userId changes

    const sendMessage = (e) => {
        e.preventDefault();

        if (message.trim()) {
            // You can modify this logic to differentiate between DM and forum messages
            socket.send(`forum:${userId}:${message}`);
            setMessage(''); // Clear the input field
        }
    };

    return (
        <div>
            <h1>Chat Room</h1>
            <input
                type="text"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
            />
            <form onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
            <div>
                <h2>Messages:</h2>
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
        </div>
    );
};

export default Chat;
