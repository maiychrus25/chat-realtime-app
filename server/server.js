const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const messageRoutes = require("./routes/upload");
const aiRoutes = require("./routes/ai");
const Message = require("./models/Message");

dotenv.config();

const app = express();

// Lấy frontend URL từ biến môi trường hoặc mặc định "*"
const frontendUrl = "https://433e7f3ac972.ngrok-free.app";

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "ngrok-skip-browser-warning",
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  })
);

// Middleware parse body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Router
app.use("/upload", messageRoutes);
app.use("/ai", aiRoutes);

const server = http.createServer(app);
const io = socketIo(server);

// Kết nối MongoDB
mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Quản lý user online & typing
const onlineUsers = new Set();
const typingUsers = new Set();

io.on("connection", (socket) => {
  console.log("New user connected");

  let addedUser = false;

  socket.on("add user", (username) => {
    if (addedUser) return;
    socket.username = username;
    onlineUsers.add(username);
    addedUser = true;

    io.emit("online users", onlineUsers.size);
    console.log(`User added: ${username}, online: ${onlineUsers.size}`);
  });

  socket.on("chat message", async ({ sender, text, imageUrl }) => {
    try {
      const newMsg = new Message({
        sender,
        text,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
      await newMsg.save();

      io.emit("chat message", newMsg);
      console.log("Saved message from", sender);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("typing", (username) => {
    typingUsers.add(username);
    io.emit("typing", Array.from(typingUsers));
  });

  socket.on("stop typing", (username) => {
    typingUsers.delete(username);
    io.emit("typing", Array.from(typingUsers));
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    if (addedUser) {
      onlineUsers.delete(socket.username);
      typingUsers.delete(socket.username);

      io.emit("online users", onlineUsers.size);
      io.emit("typing", Array.from(typingUsers));

      console.log(
        `User removed: ${socket.username}, online: ${onlineUsers.size}`
      );
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
