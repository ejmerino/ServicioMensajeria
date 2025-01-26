import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ConnectedUsers from "./components/ConnectedUsers"
import LoginSection from "./components/LoginSection"

function App() {
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [socket, setSocket] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [notification, setNotification] = useState(null)
  const messageEndRef = useRef(null)
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL

  useEffect(() => {
    const ws = new WebSocket(apiBaseUrl)

    ws.onopen = () => {
      console.log("Conectado al servidor WebSocket")
    }

    ws.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data)
      console.log("Mensaje recibido:", incomingMessage)

      if (incomingMessage.type === "MESSAGE") {
        setMessages((prevMessages) => [...prevMessages, incomingMessage])
      } else if (incomingMessage.type === "USERS") {
        setConnectedUsers(incomingMessage.users)
        setNotification(incomingMessage.message)
        setTimeout(() => setNotification(null), 3000)
      } else if (incomingMessage.type === "HISTORY") {
        setMessages(incomingMessage.history)
      }
    }

    ws.onclose = () => {
      console.log("Desconectado del servidor WebSocket")
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [apiBaseUrl])

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

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messageEndRef])

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-500 to-teal-500 flex flex-col items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-6xl"
      >
        <h2 className="text-4xl font-bold text-center mb-8 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
          Sistema de Mensajería
        </h2>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-1">
            <ConnectedUsers users={connectedUsers} />
          </div>

          <div className="col-span-3 space-y-8">
            <LoginSection
              username={username}
              isLoggedIn={isLoggedIn}
              onUsernameChange={handleUsernameChange}
              onLogin={handleLogin}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 p-6 rounded-2xl shadow-lg"
            >
              <div className="h-96 overflow-y-auto mb-6 space-y-4 pr-4">
                <AnimatePresence>
                  {messages.map((msg, index) => {
                    const isSender = msg.username === username
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={`p-4 rounded-2xl shadow-md ${
                          isSender ? "bg-blue-100 ml-auto" : "bg-purple-100"
                        } max-w-[80%]`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">{msg.username}</span>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <p className="text-gray-700">{msg.message}</p>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                <div ref={messageEndRef} />
              </div>

              <div className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje"
                  className="p-4 w-full border border-gray-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-800"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-full shadow-md hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  Enviar
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default App

