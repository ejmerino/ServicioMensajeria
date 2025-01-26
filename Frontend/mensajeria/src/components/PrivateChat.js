import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

const PrivateChat = ({ user, messages, sendMessage, onClose }) => {
  const [message, setMessage] = useState("")
  const messageEndRef = useRef(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messageEndRef]) // Updated dependency

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message)
      setMessage("")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && message.trim()) {
      handleSend()
    }
  }

  return (
    <div className="flex-1 bg-white p-3 rounded-lg shadow-md flex flex-col max-h-[83vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chat privado con {user.username}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Cerrar
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 25 }}
            className={`flex ${msg.username === user.username ? "justify-start" : "justify-end"} space-x-2`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                msg.username === user.username ? "bg-gray-200 text-left" : "bg-blue-100 text-right"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-gray-800">{msg.username}</span>
                <span className="ml-8 text-sm text-gray-500">{msg.time}</span>
              </div>
              <p className="text-sm text-gray-900 p-2 rounded-lg border border-gray-300">{msg.message}</p>
            </div>
          </motion.div>
        ))}
        <div ref={messageEndRef} />
      </div>
      <div className="mt-3 flex space-x-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje privado"
          className="p-2 w-full border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-all"
          disabled={!message.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}

export default PrivateChat

