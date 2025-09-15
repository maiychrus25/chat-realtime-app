# Real-time Chat App with Gemini AI

## Overview

This project is a real-time chat application that integrates Gemini AI for auto-replies. It allows users to send text and image messages, with chat history stored in MongoDB. The application uses WebSocket for real-time communication and provides a simple React frontend.

## Features

- Multi-user chat with real-time messaging using Socket.IO.
- Send text and image messages.
- Images are uploaded to Cloudinary and URLs are stored in the database.
- Chat history is persistent and loaded from MongoDB.
- Command `/ai <prompt>` allows users to interact with Gemini AI for auto-replies.
- User-friendly React frontend for an intuitive chat experience.

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB with Mongoose
- **AI Integration:** Gemini AI API
- **File Upload:** Multer and Cloudinary SDK
- **Frontend:** React with Vite, Socket.IO-client, and Axios

## Project Structure

```
chat-realtime-app
├── server
│   ├── server.js
│   ├── models
│   │   └── Message.js
│   ├── routes
│   │   ├── upload.js
│   │   └── ai.js
│   └── .env
├── client
│   ├── src
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
└── README.md
```

## Setup Instructions

### Backend

1. Navigate to the `server` directory.
2. Install dependencies:
   ```
   npm install express socket.io mongoose multer cloudinary dotenv
   ```
3. Create a `.env` file and add your MongoDB connection string, Cloudinary credentials, and Gemini API key.
4. Start the server:
   ```
   node server.js
   ```

### Frontend

1. Navigate to the `client` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm run dev
   ```

## Usage

- Connect to the chat application through the frontend.
- Users can send messages and upload images.
- Use the command `/ai <prompt>` to get responses from Gemini AI.
- Chat history will be displayed upon loading the application.

## License

This project is licensed under the MIT License.