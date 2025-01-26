import React from "react"
import { motion } from "framer-motion"

function ConnectedUsers({ users }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-2xl shadow-lg"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Usuarios conectados:</h3>
      <div className="space-y-2">
        {users.map((user, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="w-3 h-3 bg-green-500 rounded-full"
            ></motion.span>
            <span className="text-gray-800">{user}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default ConnectedUsers

