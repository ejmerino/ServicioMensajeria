import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import PrivateChat from "./components/PrivateChat"

function App() {
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [socket, setSocket] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [notification, setNotification] = useState(null)
  const [privateMessages, setPrivateMessages] = useState({})
  const [selectedPrivateUser, setSelectedPrivateUser] = useState(null)
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState({})
  const messageEndRef = useRef(null)
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL

  useEffect(() => {
    const ws = new WebSocket(apiBaseUrl)
    ws.onopen = () => {
      console.log("Conectado al servidor WebSocket")
    }
    ws.onclose = () => {
      console.log("Desconectado del servidor WebSocket")
    }
    setSocket(ws)
    return () => {
      ws.close()
    }
  }, [apiBaseUrl])

  useEffect(() => {
    if (!socket) return

    socket.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data)
      console.log("Mensaje recibido:", incomingMessage)

      if (isLoggedIn) {
        if (incomingMessage.type === "MESSAGE") {
          setMessages((prevMessages) => [...prevMessages, incomingMessage])
          saveToLocalStorage("publicMessages", [...messages, incomingMessage])
        } else if (incomingMessage.type === "USERS") {
          setConnectedUsers(incomingMessage.users)
          setNotification(incomingMessage.message)
          setTimeout(() => setNotification(null), 3000)
        } else if (incomingMessage.type === "HISTORY") {
          setMessages(incomingMessage.history)
          saveToLocalStorage("publicMessages", incomingMessage.history)
        } else if (incomingMessage.type === "PRIVATE_MESSAGE") {
          handlePrivateMessage(incomingMessage)
        }
      } else {
        setNotification("Inicia sesión, ¡Te están esperando!")
      }
    }

    return () => {
      socket.onmessage = null
    }
  }, [socket, isLoggedIn])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messageEndRef])

  useEffect(() => {
    const savedPublicMessages = loadFromLocalStorage("publicMessages")
    if (savedPublicMessages) {
      setMessages(savedPublicMessages)
    }

    const savedPrivateMessages = loadFromLocalStorage("privateMessages")
    if (savedPrivateMessages) {
      setPrivateMessages(savedPrivateMessages)
    }
  }, [])

  const handlePrivateMessage = (incomingMessage) => {
    setPrivateMessages((prev) => {
      const updatedMessages = {
        ...prev,
        [incomingMessage.fromSession]: [...(prev[incomingMessage.fromSession] || []), incomingMessage],
      }
      saveToLocalStorage("privateMessages", updatedMessages)
      return updatedMessages
    })

    if (selectedPrivateUser?.session !== incomingMessage.fromSession) {
      setUnreadPrivateMessages((prev) => ({
        ...prev,
        [incomingMessage.fromSession]: true,
      }))
    }
  }

  const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data))
  }

  const loadFromLocalStorage = (key) => {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  const handleMessageChange = (e) => {
    setMessage(e.target.value)
  }

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
  }

  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true)
      socket.send(JSON.stringify({ type: "JOIN", username }))
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && message.trim()) {
      sendMessage()
    }
  }

  const sendMessage = () => {
    if (socket && message.trim()) {
      const now = new Date()
      const formattedTime = now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })

      const messagePayload = {
        type: "MESSAGE",
        username,
        message,
        time: formattedTime,
      }

      socket.send(JSON.stringify(messagePayload))
      setMessage("")
    }
  }

  const sendPrivateMessage = (toSession, message) => {
    if (socket) {
      const now = new Date()
      const formattedTime = now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })

      const privateMessagePayload = {
        type: "PRIVATE_MESSAGE",
        fromSession: connectedUsers.find((u) => u.username === username).session,
        toSession: toSession,
        username,
        message,
        time: formattedTime,
      }

      socket.send(JSON.stringify(privateMessagePayload))
      handlePrivateMessage({ ...privateMessagePayload, fromSession: toSession })
    }
  }

  const openPrivateChat = (user) => {
    setSelectedPrivateUser(user)
    setUnreadPrivateMessages((prev) => ({
      ...prev,
      [user.session]: false,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-500 to-teal-500 flex items-center justify-center py-5">
      <div className="grid grid-cols-4 gap-4 w-full max-w-6xl h-[90vh]">
        {/* Usuarios conectados */}
        <div className="col-span-1 bg-white p-2 rounded-lg shadow-md h-full overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Usuarios conectados:</h3>
          <div className="space-y-2">
            {connectedUsers.map((user, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => openPrivateChat(user)}
              >
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-800 text-sm">{user.username}</span>
                {unreadPrivateMessages[user.session] && <span className="w-3 h-3 bg-red-500 rounded-full"></span>}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Login y Mensajería */}
        <div className="col-span-3 flex flex-col space-y-4 h-full">
          {/* Login */}
          <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3">
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Ingresa tu nombre"
              className="p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-800"
              disabled={isLoggedIn}
            />
            <button
              onClick={handleLogin}
              disabled={isLoggedIn || username.trim() === ""}
              className={`p-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all ${isLoggedIn ? "cursor-not-allowed bg-gray-400" : ""}`}
            >
              {isLoggedIn ? "Logeado" : "Log In"}
            </button>
          </div>

          {/* Mensajes */}
          {selectedPrivateUser ? (
            <PrivateChat
              user={selectedPrivateUser}
              messages={privateMessages[selectedPrivateUser.session] || []}
              sendMessage={(message) => sendPrivateMessage(selectedPrivateUser.session, message)}
              onClose={() => setSelectedPrivateUser(null)}
            />
          ) : (
            <div className="flex-1 bg-white p-3 rounded-lg shadow-md flex flex-col max-h-[83vh]">
              <div className="flex-1 overflow-y-auto space-y-3">
                {messages.map((msg, index) => {
                  const isSender = msg.username === username
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 100, damping: 25 }}
                      className={`flex ${isSender ? "justify-end" : "justify-start"} space-x-2`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg shadow-sm ${isSender ? "bg-blue-100 text-right" : "bg-gray-200 text-left"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-bold text-gray-800">{msg.username}</span>
                          <span className="ml-8 text-sm text-gray-500">{msg.time && msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-900 p-2 rounded-lg border border-gray-300">{msg.message}</p>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={messageEndRef} />
              </div>

              <div className="mt-3 flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje"
                  className="p-2 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-all"
                  disabled={!isLoggedIn || !message.trim()}
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notificación */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed bottom-5 right-5 bg-violet-600 text-white p-4 rounded-lg shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

