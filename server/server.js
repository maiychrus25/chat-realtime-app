const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const messageRoutes = require("./routes/upload");
const aiRoutes = require("./routes/ai");
const Message = require("./models/Message");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Connect Mongoose Database
mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/upload", messageRoutes);
app.use("/ai", aiRoutes);

// --- Dữ liệu theo kết nối để quản lý user online & typing
const onlineUsers = new Set();
const typingUsers = new Set();

io.on("connection", (socket) => {
  console.log("New user connected");

  let addedUser = false;

  // Client gửi username khi kết nối hoặc thay đổi tên
  socket.on("add user", (username) => {
    if (addedUser) return;
    socket.username = username;
    onlineUsers.add(username);
    addedUser = true;

    // Gửi số lượng user online cho tất cả client
    io.emit("online users", onlineUsers.size);
    console.log(`User added: ${username}, online: ${onlineUsers.size}`);
  });

  socket.on("chat message", async ({ sender, text, imageUrl }) => {
    try {
      // Save message to MongoDB
      const newMsg = new Message({
        sender,
        text: text,
        imageUrl,
        createdAt: new Date().toISOString(),
      });
      await newMsg.save();

      // Emit message to all clients
      io.emit("chat message", newMsg);
      console.log("Saved message from", sender);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // Xử lý user đang gõ (typing)
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
