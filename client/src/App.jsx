import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.get("http://localhost:5000/upload/history").then((res) => {
      setMessages(res.data);
    });

    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    let msg = { sender: username, text: input, imageUrl: null };

    if (input.startsWith("/ai ")) {
      const prompt = input.replace("/ai ", "");
      const userMsg = {
        sender: username,
        text: input,
        imageUrl: preview || null,
      };
      socket.emit("chat message", userMsg);
      setInput("");
      try {
        if (image) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const imageBase64 = reader.result.split(",")[1];
            const res = await axios.post("http://localhost:5000/ai", {
              prompt,
              sender: username,
              image: imageBase64,
            });
            socket.emit("chat message", {
              sender: "Gemini-Bot",
              text: res.data.message,
              imageUrl: res.data.imageUrl || null,
              createdAt: new Date(),
            });
          };
          reader.readAsDataURL(image);
          setImage(null);
          setPreview(null);
          return;
        } else {
          const res = await axios.post("http://localhost:5000/ai", {
            prompt,
            sender: username,
          });
          socket.emit("chat message", {
            sender: "Gemini-Bot",
            text: res.data.message,
            imageUrl: null,
            createdAt: new Date(),
          });
        }
      } catch {
        alert("AI server error!");
      }
      return;
    }

    if (image) {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("sender", username);
      formData.append("text", input);
      try {
        const res = await axios.post("http://localhost:5000/upload", formData);
        socket.emit("chat message", res.data);
      } catch {
        alert("Image upload error!");
      }
      setImage(null);
      setPreview(null);
      setInput("");
      return;
    }

    socket.emit("chat message", msg);
    setInput("");
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Gemini AI Chat</h2>
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
            <span className="chat-text">{msg.text}</span>
            {msg.imageUrl && (
              <div className="chat-image-wrapper">
                <img src={msg.imageUrl} alt="uploaded" className="chat-image" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message or /ai <prompt>"
          className="chat-input"
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
