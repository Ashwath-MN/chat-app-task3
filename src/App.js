import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";


const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [typing, setTyping] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const typingTimeout = useRef(null);
  const chatEndRef = useRef(null);
  const emojiRef = useRef(null); // ⭐ detect outside click

  const emojis = ["😀","😂","😍","😎","😭","❤️","👍","🔥","🎉","🙏"];

  // auto scroll
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // close emoji when click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
      scrollToBottom();
    });

    socket.on("typing", (data) => {
      setTyping(data);

      if (typingTimeout.current) clearTimeout(typingTimeout.current);

      typingTimeout.current = setTimeout(() => setTyping(""), 4000);
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
    };
  }, []);

  const sendMessage = () => {
    if (message !== "" && username !== "") {
      socket.emit("send_message", {
        user: username,
        text: message,
      });
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleTyping = () => {
    if (username !== "") {
      socket.emit("typing", username + " is typing...");
    }
  };

  const clearChat = () => setChat([]);

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px", fontFamily: "Arial" }}>
      <h1>💬 Real-Time Chat App</h1>

      <input
        type="text"
        placeholder="Enter your name"
        style={{ padding: "8px", width: "200px" }}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div style={{ minHeight: "20px", margin: "5px 0" }}>
        {typing && (
          <p style={{ color: "green", fontSize: "12px" }}>{typing}</p>
        )}
      </div>

      {/* Chat Container */}
      <div
        style={{
          width: "300px",
          height: "400px",
          margin: "20px auto",
          border: "1px solid black",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {chat.map((msg, index) => {
            const isMyMessage = msg.user === username;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: isMyMessage ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    background: isMyMessage ? "#DCF8C6" : "#f1f0f0",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    maxWidth: "70%",
                    textAlign: "left",
                  }}
                >
                  {!isMyMessage && (
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {msg.user}
                    </div>
                  )}
                  <div>{msg.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Area */}
        <div
          ref={emojiRef}
          style={{
            borderTop: "1px solid #ccc",
            padding: "10px",
            position: "relative",
          }}
        >
          {/* Emoji Panel */}
          {showEmoji && (
            <div
              style={{
                position: "absolute",
                bottom: "55px",
                left: "10px",
                background: "#fff",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "10px",
              }}
            >
              {emojis.map((e, i) => (
                <span
                  key={i}
                  style={{ fontSize: "20px", cursor: "pointer", margin: "5px" }}
                  onClick={() => addEmoji(e)}
                >
                  {e}
                </span>
              ))}
            </div>
          )}

          {/* Same Line Layout */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

            <input
              type="text"
              value={message}
              placeholder="Type message..."
              style={{ flex: 1, padding: "8px" }}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
            />

            <button onClick={sendMessage}>Send</button>
          </div>

          <button
            onClick={clearChat}
            style={{
              marginTop: "8px",
              background: "red",
              color: "white",
              padding: "5px 10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
