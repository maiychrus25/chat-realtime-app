const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const axios = require("axios");

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAs16cTcN1keHxvHdEI4RY1ZTr9sSA17T4`;

// Middleware to set headers cho tất cả routes
router.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  res.setHeader("Content-Type", "application/json");
  next();
});

router.post("/", async (req, res) => {
  try {
    const { prompt, sender, image, imageUrl } = req.body;

    if (!prompt || !sender) {
      return res.status(400).json({ error: "Prompt and sender are required." });
    }

    // Save user message
    const userMessage = new Message({
      sender,
      text: prompt,
      imageUrl: image ? `data:image/jpeg;base64,${image}` : imageUrl || null,
      createdAt: new Date().toISOString(),
    });
    await userMessage.save();

    // Prepare Gemini request
    const parts = [{ text: prompt }];

    if (image) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: image,
        },
      });
    }

    // Call Gemini API với headers
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [{ parts }],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Save AI response
    const aiMessage = new Message({
      sender: "Gemini-Bot",
      text: reply || "No response from AI",
      imageUrl: image ? `data:image/jpeg;base64,${image}` : imageUrl || null,
      createdAt: new Date().toISOString(),
    });
    await aiMessage.save();

    res.status(200).json({
      code: "success",
      message: reply || "No response from AI",
      imageUrl: image ? `data:image/jpeg;base64,${image}` : imageUrl || null,
    });
  } catch (error) {
    console.error("Error calling Gemini AI API:", error);
    res.status(500).json({
      code: "error",
      message: "Failed to get response from AI.",
    });
  }
});

module.exports = router;
