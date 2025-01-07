import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { motion } from 'framer-motion'; // Animaciones suaves para los mensajes

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado para controlar si el usuario está loggeado
  const [connectedUsers, setConnectedUsers] = useState([]); // Estado para los usuarios conectados
  const messageEndRef = useRef(null); // Desplazamiento al último mensaje

  // Establecer conexión WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://10.40.14.88:8080/ws'); // Cambia la URL si es necesario

    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };

    ws.onmessage = (event) => {
      const incomingMessage = event.data;
      console.log('Mensaje recibido:', incomingMessage);

      // Aquí ya no hacemos JSON.parse() directamente
      // Si es un string de mensaje, lo agregamos directamente al estado
      setMessages((prevMessages) => [...prevMessages, incomingMessage]);

      // Si el mensaje contiene la información de usuarios conectados, puedes procesarlo aquí
      // Asegúrate de que el backend envíe correctamente el formato de los usuarios
      if (incomingMessage.includes('users:')) {
        try {
          const usersData = JSON.parse(incomingMessage.replace('users:', ''));
          setConnectedUsers(usersData.users);
        } catch (error) {
          console.error('Error al parsear los usuarios:', error);
        }
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

  // Cambiar mensaje
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Cambiar nombre de usuario
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  // Función para iniciar sesión
  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true); // Marcar al usuario como loggeado
    }
  };

  // Enviar mensaje con la tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && message.trim()) {
      sendMessage();
    }
  };

  // Función para enviar el mensaje
  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.send(`${username || 'Anonimo'}: ${message}`);
      setMessage('');
    }
  };

  // Agregar emoji al mensaje
  const addEmoji = (emoji) => {
    setMessage(message + emoji);
  };

  // Desplazamiento al último mensaje
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-500 to-teal-500 flex flex-col items-center justify-center py-10">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xl">
        <h2 className="text-4xl font-bold text-center mb-6 text-gray-800">Sistema de Mensajería</h2>

        {/* Nombre de Usuario y Chat */}
        <div className="space-y-6">
          {/* Caja de nombre de usuario y botón de login */}
          <div className="mb-4 flex items-center justify-between">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Ingresa tu nombre"
              className="p-4 w-full border border-gray-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-800"
            />
            <button
              onClick={handleLogin}
              disabled={isLoggedIn || username.trim() === ''}
              className={`ml-3 p-4 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all ${isLoggedIn ? 'cursor-not-allowed bg-gray-400' : ''}`}
            >
              {isLoggedIn ? 'Logeado' : 'Log In'}
            </button>
          </div>

          {/* Usuarios conectados */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Usuarios conectados:</h3>
            <div className="space-y-2">
              {connectedUsers.map((user, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-gray-800">{user}</span>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
              ))}
            </div>
          </div>

          {/* Ventana de chat */}
          <div className="flex flex-col space-y-3 h-80 overflow-y-auto p-4 bg-gray-50 rounded-2xl shadow-lg mb-6">
            {messages.map((msg, index) => {
              const isSender = msg.startsWith(username); // Verificar si el mensaje fue enviado por el usuario
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 25 }}
                  className={`p-4 rounded-lg max-w-xs mx-auto ${
                    isSender ? 'bg-blue-100 text-right ml-auto' : 'bg-gray-200 text-left'
                  }`}
                >
                  <p className="text-sm text-gray-800">{msg}</p>
                </motion.div>
              );
            })}
            <div ref={messageEndRef} />
          </div>

          {/* Caja de texto para mensaje y botón de enviar */}
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

          {/* Sección de emojis */}
          <div className="mt-6 space-x-4 flex justify-center">
            <button
              onClick={() => addEmoji('😊')}
              className="bg-yellow-300 text-black p-3 rounded-full hover:bg-yellow-400 transition-all"
            >
              😊
            </button>
            <button
              onClick={() => addEmoji('😂')}
              className="bg-yellow-300 text-black p-3 rounded-full hover:bg-yellow-400 transition-all"
            >
              😂
            </button>
            <button
              onClick={() => addEmoji('❤️')}
              className="bg-red-300 text-black p-3 rounded-full hover:bg-red-400 transition-all"
            >
              ❤️
            </button>
            <button
              onClick={() => addEmoji('😎')}
              className="bg-blue-300 text-black p-3 rounded-full hover:bg-blue-400 transition-all"
            >
              😎
            </button>
            <button
              onClick={() => addEmoji('😍')}
              className="bg-pink-300 text-black p-3 rounded-full hover:bg-pink-400 transition-all"
            >
              😍
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
