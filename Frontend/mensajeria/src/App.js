import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isUsernameSet, setIsUsernameSet] = useState(false); // Estado para saber si el usuario ha confirmado su nombre

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws'); // Cambia la URL a tu backend

    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    ws.onmessage = (event) => {
      const incomingMessage = event.data;
      setMessages((prevMessages) => [...prevMessages, incomingMessage]);
    };

    ws.onclose = () => {
      console.log('Desconectado del servidor WebSocket');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket && message) {
      socket.send(`${username}: ${message}`);
      setMessage('');
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && username && isUsernameSet) {
      // Prevents submitting the form
      e.preventDefault();
      if (username) {
        // Focus on message input after entering the username
        document.getElementById('message-input').focus();
      }
    }
  };

  const handleUsernameSubmit = () => {
    if (username) {
      setIsUsernameSet(true); // Habilitar la interfaz de mensajes
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center mb-4">Sistema de Mensajería</h2>
        {!isUsernameSet ? (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              value={username}
              onChange={handleUsernameChange}
              onKeyPress={handleKeyPress}  // Detectar presionar "Enter"
              className="w-full p-2 border rounded-md mb-4"
            />
            <button
              onClick={handleUsernameSubmit}
              className="w-full bg-blue-500 text-white p-2 rounded-md"
            >
              Aceptar
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <div className="bg-blue-500 text-white p-2 rounded-md mb-2">
              <h3 className="text-center">Bienvenido, {username}</h3>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-md mb-4">
              {messages.map((msg, index) => (
                <div key={index} className="bg-gray-200 p-2 rounded-lg">
                  {msg}
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                id="message-input"
                value={message}
                onChange={handleMessageChange}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()} // Enviar con "Enter"
                placeholder="Escribe tu mensaje"
                className="w-full p-2 border rounded-md"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white p-2 rounded-md"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
