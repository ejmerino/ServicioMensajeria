import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { motion } from 'framer-motion'; // Animaciones suaves para los mensajes

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const messageEndRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');

    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    ws.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);
      console.log('Mensaje recibido:', incomingMessage);

      if (incomingMessage.type === 'MESSAGE') {
        setMessages((prevMessages) => [...prevMessages, incomingMessage]);
      } else if (incomingMessage.type === 'USERS') {
        setConnectedUsers(incomingMessage.users);
      } else if (incomingMessage.type === 'HISTORY') {
        setMessages(incomingMessage.history);
      }
    };

    ws.onclose = () => {
      console.log('Desconectado del servidor WebSocket');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true);
      socket.send(JSON.stringify({ type: 'JOIN', username }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && message.trim()) {
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.send(JSON.stringify({ type: 'MESSAGE', username, message }));
      setMessage('');
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-500 to-teal-500 flex flex-col items-center justify-center py-10">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-6 text-gray-800">Sistema de Mensajería</h2>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Usuarios conectados:</h3>
            <div className="space-y-2">
              {connectedUsers.map((user, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-gray-800">{user}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Ingresa tu nombre"
                className="p-4 w-full border border-gray-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-800"
                disabled={isLoggedIn}
              />
              <button
                onClick={handleLogin}
                disabled={isLoggedIn || username.trim() === ''}
                className={`ml-3 p-4 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all ${isLoggedIn ? 'cursor-not-allowed bg-gray-400' : ''}`}
              >
                {isLoggedIn ? 'Logeado' : 'Log In'}
              </button>
            </div>

            <div className="flex flex-col space-y-3 h-80 overflow-y-auto p-4 bg-gray-50 rounded-2xl shadow-lg mb-6">
              {messages.map((msg, index) => {
                const isSender = msg.username === username;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 25 }}
                    className={`p-4 rounded-lg max-w-xs ${
                      isSender ? 'bg-blue-100 ml-auto text-right' : 'bg-gray-200 text-left'
                    }`}
                  >
                    <p className="text-sm font-semibold">{msg.username}</p>
                    <p className="text-sm text-gray-800">{msg.message}</p>
                  </motion.div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            <div className="flex space-x-3 mt-6">
              <input
                type="text"
                value={message}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje"
                className="p-4 w-full border border-gray-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white p-4 rounded-full shadow-md hover:bg-blue-600 transition-all"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
