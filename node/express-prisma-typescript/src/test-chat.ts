import { io, Socket } from 'socket.io-client';

// Replace these with actual JWT tokens from your auth system
const user1Token = 'YOUR_USER1_JWT_TOKEN';
const user2Token = 'YOUR_USER2_JWT_TOKEN';

// Create two socket connections (simulating two users)
const socket1 = io('http://localhost:3000', {
  auth: { token: user1Token }
});

const socket2 = io('http://localhost:3000', {
  auth: { token: user2Token }
});

// Set up event handlers for first user
socket1.on('connect', () => {
  console.log('User 1 connected');
});

socket1.on('error', (error) => {
  console.log('User 1 error:', error);
});

socket1.on('chat_history', (history) => {
  console.log('User 1 received chat history:', history);
});

socket1.on('new_message', (message) => {
  console.log('User 1 received message:', message);
});

// Set up event handlers for second user
socket2.on('connect', () => {
  console.log('User 2 connected');
});

socket2.on('error', (error) => {
  console.log('User 2 error:', error);
});

socket2.on('chat_history', (history) => {
  console.log('User 2 received chat history:', history);
});

socket2.on('new_message', (message) => {
  console.log('User 2 received message:', message);
});

// Test sequence
setTimeout(() => {
  console.log('Starting chat between users...');
  
  // User 1 starts chat with User 2
  socket1.emit('start_chat', 'USER2_ID');
  
  // Wait 1 second, then send a message
  setTimeout(() => {
    console.log('User 1 sending message...');
    socket1.emit('send_message', {
      receiverId: 'USER2_ID',
      content: 'Hello from User 1!'
    });
  }, 1000);
  
  // Wait 2 seconds, then send a reply
  setTimeout(() => {
    console.log('User 2 sending message...');
    socket2.emit('send_message', {
      receiverId: 'USER1_ID',
      content: 'Hi User 1, received your message!'
    });
  }, 2000);
  
}, 1000);

// Cleanup after 5 seconds
setTimeout(() => {
  console.log('Cleaning up...');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
}, 5000); 