const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Message = require("../models/Message");
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for uploading images
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      async (error, result) => {
        if (error) {
          return res
            .status(500)
            .json({ error: "Upload failed", details: error });
        }
        // Save message with image
        const msg = await Message.create({
          sender: req.body.sender,
          text: req.body.text || "",
          imageUrl: result.secure_url,
          createdAt: new Date(),
        });
        res.status(200).json(msg);
      }
    );
    stream.end(req.file.buffer);
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
