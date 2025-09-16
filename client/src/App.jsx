import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import ReactMarkdown from "react-markdown";
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

  // Trạng thái AI đang trả lời
  const [aiTyping, setAiTyping] = useState(false);

  // Số user online hiện tại
  const [onlineCount, setOnlineCount] = useState(0);

  // Danh sách username đang typing
  const [usersTyping, setUsersTyping] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("add user", username);
  }, [username]);

  useEffect(() => {
    // Lấy lịch sử chat
    axios.get("http://localhost:5000/upload/history").then((res) => {
      setMessages(res.data);
    });

    // Nhận tin nhắn chat mới
    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      // AI trả lời xong thì tắt trạng thái
      if (msg.sender === "Gemini-Bot") {
        setAiTyping(false);
      }
    });

    // Cập nhật số lượng user online
    socket.on("online users", (count) => {
      setOnlineCount(count);
    });

    // Cập nhật danh sách user đang typing
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

  // Gửi sự kiện typing khi nhập input
  useEffect(() => {
    if (input.trim() === "") {
      socket.emit("stop typing", username);
      return;
    }
    socket.emit("typing", username);

    // Tạo timeout để gửi stop typing khi ngưng nhập 1s
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

  const sendMessage = async (e) => {
    e.preventDefault();

    // Khi gửi, user ngừng typing
    socket.emit("stop typing", username);

    if (input.startsWith("/ai ")) {
      const prompt = input.replace("/ai ", "");
      setInput("");
      setAiTyping(true);

      try {
        if (image) {
          const formData = new FormData();
          formData.append("image", image);
          formData.append("sender", username);
          formData.append("text", input);

          const uploadRes = await axios.post(
            "http://localhost:5000/upload",
            formData
          );
          const imageUrl = uploadRes.data.imageUrl;

          const reader = new FileReader();
          reader.onloadend = async () => {
            const imageBase64 = reader.result.split(",")[1];
            const res = await axios.post("http://localhost:5000/ai", {
              prompt,
              sender: username,
              image: imageBase64,
              imageUrl,
            });
            socket.emit("chat message", {
              sender: "Gemini-Bot",
              text: res.data.message,
              imageUrl: imageUrl,
              createdAt: new Date(),
            });
          };
          reader.readAsDataURL(image);

          socket.emit("chat message", {
            sender: username,
            text: input,
            imageUrl: imageUrl,
            createdAt: new Date(),
          });

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

          socket.emit("chat message", {
            sender: username,
            text: input,
            imageUrl: null,
            createdAt: new Date(),
          });
        }
      } catch {
        alert("AI server error!");
        setAiTyping(false);
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

    socket.emit("chat message", {
      sender: username,
      text: input,
      imageUrl: null,
      createdAt: new Date(),
    });
    setInput("");
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Gemini AI Chat</h2>

      {/* Hiển thị số user online */}
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

        {/* Hiển thị trạng thái typing của user khác */}
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
