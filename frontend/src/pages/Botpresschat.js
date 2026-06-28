import React, { useState, useEffect, useRef, useContext } from "react";
import api from "../api/axiosConfig";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Botpresschat.css";

const BotpressChat = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Welcome to PackMate Travel Assistant! I can help you with air travel questions such as baggage rules, cabin and checked luggage, prohibited items, customs regulations, airline policies, and travel guidelines. Please note that this assistant is designed specifically for flight-related travel queries.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post("/travel-chat", { message: userMessage });
      const botResponse = res.data;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botResponse.answer,
          sources: botResponse.sources || [],
          isFallback: botResponse.is_fallback || false,
        },
      ]);
    } catch (err) {
      console.error("Error communicating with travel assistant chatbot:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I'm sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hide the chatbot on auth pages (login & signup)
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  return (
    <div className="travel-chatbot-container">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Ask Travel Assistant"
        >
          <div className="chatbot-icon">💬</div>
          <span className="chatbot-toggle-text">Travel Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <h4 className="chatbot-title">PackMate Assistant</h4>
                <p className="chatbot-subtitle">Online • PDF Travel RAG</p>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-message-row ${msg.sender}`}>
                <div className={`chatbot-message-bubble ${msg.sender}`}>
                  {msg.isFallback && (
                    <span className="chatbot-fallback-badge">General AI Suggestion</span>
                  )}
                  <p className="chatbot-message-text">{msg.text}</p>
                  {msg.isFallback && (
                    <div className="chatbot-fallback-disclaimer">
                      ⚠️ This answer is not from the uploaded travel documents and should be verified with official sources.
                    </div>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="chatbot-sources">
                      <span className="sources-label">Sources:</span>
                      {msg.sources.map((src, sIdx) => (
                        <span key={sIdx} className="source-pill" title={src}>
                          📄 {src.length > 20 ? `${src.substring(0, 17)}...` : src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="chatbot-message-row bot">
                <div className="chatbot-message-bubble bot typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about baggage rules, prohibited items..."
              className="chatbot-input-field"
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" className="chatbot-send-btn" disabled={isLoading}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BotpressChat;
