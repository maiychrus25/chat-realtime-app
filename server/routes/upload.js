const express = require("express");
const multer = require("multer");
const Message = require("../models/Message");
const router = express.Router();
const cloudinaryService = require("../services/cloudinary.service");
const upload = multer({ storage: cloudinaryService.storage });

// Route for uploading images
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload image to Cloudinary
    // Save message with imageUrl to MongoDB

    const file = req.file;
    console.log(file);

    const msg = new Message({
      sender: req.body.sender,
      text: req.body.text || "",
      imageUrl: file.path,
      createdAt: new Date(),
    });
    msg.save();
    res.status(200).json(msg);
  } catch (error) {
    res.status(500).json({ error: "Upload failed", details: error });
  }
});

// Route for chat history
router.get("/history", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = router;
