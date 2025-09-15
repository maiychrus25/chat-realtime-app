const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const axios = require("axios");

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAs16cTcN1keHxvHdEI4RY1ZTr9sSA17T4`;

router.post("/", async (req, res) => {
  const { prompt, sender, image } = req.body;
  if (!prompt || !sender) {
    return res.status(400).json({ error: "Prompt and sender are required." });
  }

  // Save user prompt as a message
  const userMessage = new Message({
    sender,
    text: prompt,
    imageUrl: image ? `data:image/jpeg;base64,${image}` : null,
    createdAt: new Date(),
  });
  await userMessage.save();

  try {
    // Tạo parts cho Gemini
    const parts = [{ text: prompt }];
    if (image) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: image,
        },
      });
    }

    // Gửi lên Gemini
    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts }],
    });

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Lưu phản hồi AI vào DB
    const aiMessage = new Message({
      sender: "Gemini-Bot",
      text: reply,
      imageUrl: image ? `data:image/jpeg;base64,${image}` : null,
      createdAt: new Date(),
    });
    await aiMessage.save();

    res.status(200).json({
      code: "success",
      message: reply,
      imageUrl: image ? `data:image/jpeg;base64,${image}` : null,
    });
  } catch (error) {
    console.error("Error calling Gemini AI API:", error);
    res
      .status(500)
      .json({ code: "error", message: "Failed to get response from AI." });
  }
});

module.exports = router;
