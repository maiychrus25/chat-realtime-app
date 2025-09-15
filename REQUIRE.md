# Project: Real-time Chat App with Gemini AI (Normal Version)

## 🎯 Goal

Build a real-time chat application that supports:

- Multi-user chat with WebSocket (Socket.IO).
- Sending text and image messages.
- Images uploaded to Cloudinary.
- Chat history stored in MongoDB (persistent after reload).
- Command `/ai <prompt>`: integrates Gemini AI (normal version) for auto-reply.
- Simple React frontend for UI.

## ⚙️ Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB + Mongoose
- **AI:** Gemini AI API (server-side only)
- **File Upload:** Multer + Cloudinary SDK
- **Frontend:** React + Vite + Socket.IO-client + Axios

## 📂 Main Features

1. **User Connection**

   - Users connect via Socket.IO.
   - Random username or editable username field.

2. **Messages**

   - Message model: `{ sender, text, imageUrl, createdAt }`
   - Stored in MongoDB.
   - Loaded when frontend initializes.

3. **Image Upload**

   - Client uploads file → sent to backend API → Cloudinary → returns URL.
   - URL saved in DB and emitted as message.

4. **AI Integration**

   - If user types `/ai <prompt>`:
     - Save user prompt as message.
     - Backend calls Gemini AI API with prompt.
     - Gemini response returned as message from `Gemini-Bot`.

5. **Frontend**
   - Chat box with message list, input field, file upload.
   - Auto-scroll to latest message.
   - Messages show sender + text + optional image.

## 🚀 Requirements

- `server/`
  - `server.js` → setup Express, Socket.IO, routes, DB connection.
  - `models/Message.js`
  - `routes/upload.js`
  - `routes/ai.js`
- `client/`
  - `src/App.jsx`
  - `src/main.jsx`
  - `vite.config.js`
- `.env` configs for MongoDB, Cloudinary, Gemini API.
