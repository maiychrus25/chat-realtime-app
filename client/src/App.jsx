import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

const BACKEND_URL = "https://c1981cf1a2c2.ngrok-free.app";

// Cấu hình Socket.IO với đầy đủ options
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"], // Ưu tiên websocket trước
  withCredentials: true,
  extraHeaders: {
    "ngrok-skip-browser-warning": "true",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "ngrok-skip-browser-warning, Content-Type",
  },
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [usersTyping, setUsersTyping] = useState([]);

  const messagesEndRef = useRef(null);

  // API call functions với headers được set trực tiếp
  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/upload/history`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };

  const sendToAI = async (promptData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/ai`, promptData, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("AI request failed:", error);
      throw error;
    }
  };

  const uploadImage = async (formData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  };

  useEffect(() => {
    socket.emit("add user", username);
  }, [username]);

  useEffect(() => {
    fetchChatHistory();

    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender === "Gemini-Bot") {
        setAiTyping(false);
      }
    });

    socket.on("online users", (count) => {
      setOnlineCount(count);
    });

    socket.on("typing", (typingUsers) => {
      setUsersTyping(typingUsers.filter((user) => user !== username));
    });

    return () => {
      socket.off("chat message");
      socket.off("online users");
      socket.off("typing");
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (input.trim() === "") {
      socket.emit("stop typing", username);
      return;
    }

    socket.emit("typing", username);
    const timeoutId = setTimeout(() => {
      socket.emit("stop typing", username);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [input, username]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleAIMessage = async (
    prompt,
    imageBase64 = null,
    imageUrl = null
  ) => {
    try {
      const aiResponse = await sendToAI({
        prompt,
        sender: username,
        image: imageBase64,
        imageUrl,
      });

      socket.emit("chat message", {
        sender: "Gemini-Bot",
        text: aiResponse.message,
        imageUrl: aiResponse.imageUrl,
        createdAt: new Date(),
      });
    } catch (error) {
      alert("AI server error!");
      setAiTyping(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    socket.emit("stop typing", username);

    if (input.startsWith("/ai ")) {
      const prompt = input.replace("/ai ", "");
      setInput("");
      setAiTyping(true);

      // Send user message first
      socket.emit("chat message", {
        sender: username,
        text: input,
        imageUrl: null,
        createdAt: new Date(),
      });

      if (image) {
        try {
          const formData = new FormData();
          formData.append("image", image);
          formData.append("sender", username);
          formData.append("text", input);

          const uploadRes = await uploadImage(formData);
          const uploadedImageUrl = uploadRes.imageUrl;

          const reader = new FileReader();
          reader.onloadend = async () => {
            const imageBase64 = reader.result.split(",")[1];
            await handleAIMessage(prompt, imageBase64, uploadedImageUrl);
          };
          reader.readAsDataURL(image);
        } catch (error) {
          setAiTyping(false);
        }

        setImage(null);
        setPreview(null);
      } else {
        await handleAIMessage(prompt);
      }
      return;
    }

    // Regular message with image
    if (image) {
      try {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("sender", username);
        formData.append("text", input);

        const uploadedMsg = await uploadImage(formData);
        socket.emit("chat message", uploadedMsg);
      } catch (error) {
        alert("Image upload error!");
      }
    } else {
      // Regular text message
      socket.emit("chat message", {
        sender: username,
        text: input,
        imageUrl: null,
        createdAt: new Date(),
      });
    }

    setInput("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Gemini AI Chat</h2>

      <div style={{ marginBottom: 10 }}>
        <b>Online users: {onlineCount}</b>
      </div>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="username-input"
        placeholder="Username"
      />

      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === username ? "own" : ""} ${
              msg.sender === "Gemini-Bot" ? "ai" : ""
            }`}
          >
            <span className="chat-sender">{msg.sender}:</span>
            <span className="chat-text">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </span>
            {msg.imageUrl && (
              <div className="chat-image-wrapper">
                <img src={msg.imageUrl} alt="uploaded" className="chat-image" />
              </div>
            )}
          </div>
        ))}

        {aiTyping && (
          <div className="chat-message aiTyping">
            <span className="chat-sender">Gemini-Bot đang trả lời...</span>
          </div>
        )}

        {usersTyping.length > 0 && (
          <div className="chat-message typingIndicator">
            <i>{usersTyping.join(", ")} đang chat...</i>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message or /ai <prompt>"
          className="chat-input"
          autoComplete="off"
        />
        <label className="file-upload-label">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-upload"
          />
          📷
        </label>
        <button type="submit" className="send-btn">
          Send
        </button>
      </form>

      {preview && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <img
            src={preview}
            alt="preview"
            style={{
              maxWidth: 180,
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(44,62,80,0.12)",
            }}
          />
          <div>
            <button
              type="button"
              style={{
                marginTop: 6,
                background: "#eee",
                border: "none",
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
              }}
              onClick={() => {
                setImage(null);
                setPreview(null);
              }}
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
