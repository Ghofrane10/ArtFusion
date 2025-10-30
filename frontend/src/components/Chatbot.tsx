import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Bonjour ! Je suis ArtBot, votre assistant ArtFusion. Comment puis-je vous aider aujourd'hui ?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chatbot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: messages.length + 2,
          text: data.response,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorData = await response.json();
        const errorMessage: Message = {
          id: messages.length + 2,
          text: `Désolé, une erreur s'est produite : ${errorData.error || 'Erreur inconnue'}`,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Désolé, je ne peux pas me connecter au service de chat pour le moment. Veuillez réessayer plus tard.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleChatbot}
        aria-label="Ouvrir le chat ArtBot"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <span className="chatbot-icon">🎨</span>
              <div className="chatbot-info">
                <h3>ArtBot</h3>
                <span className="chatbot-status">En ligne</span>
              </div>
            </div>
            <button
              className="chatbot-close"
              onClick={toggleChatbot}
              aria-label="Fermer le chat"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.isBot ? 'bot' : 'user'}`}
              >
                <div className="message-avatar">
                  {message.isBot ? '🎨' : '👤'}
                </div>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">🎨</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={isLoading}
              className="chatbot-input"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="chatbot-send-button"
            >
              {isLoading ? '...' : '🔍'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;