const express = require("express");
const multer = require("multer");
const Message = require("../models/Message");
const router = express.Router();
const cloudinaryService = require("../services/cloudinary.service");
const upload = multer({ storage: cloudinaryService.storage });

// Middleware to set headers
router.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { sender, text } = req.body;
    let imageUrl = null;

    if (req.file) {
      imageUrl = req.file.path;
    }

    const msg = new Message({
      sender: sender,
      text: text || "",
      imageUrl: imageUrl,
      createdAt: new Date(),
    });

    await msg.save();

    res.status(200).json(msg);
  } catch (error) {
    res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch chat history",
      details: error.message,
    });
  }
});

module.exports = router;
