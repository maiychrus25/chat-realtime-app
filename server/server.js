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
app.use("/upload", messageRoutes);
app.use("/ai", aiRoutes);

// Socket.IO chat message handler
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("chat message", async (msg) => {
    try {
      // Save message to MongoDB
      const savedMsg = await Message.create({
        sender: msg.sender,
        text: msg.text,
        imageUrl: msg.imageUrl || null,
        createdAt: new Date(),
      });
      // Emit message to all clients
      io.emit("chat message", savedMsg);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
