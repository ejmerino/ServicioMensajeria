const socketUrl = 'ws://localhost:8080/ws';  // Asegúrate de que el backend esté corriendo en este puerto

let socket = null;

export const connectWebSocket = (username, onMessageReceived) => {
  socket = new WebSocket(socketUrl);

  socket.onopen = () => {
    console.log('Conexión WebSocket establecida');
    socket.send(JSON.stringify({ type: 'JOIN', username }));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onMessageReceived(message);
  };

  socket.onerror = (error) => {
    console.log('Error en WebSocket:', error);
  };

  socket.onclose = () => {
    console.log('Conexión WebSocket cerrada');
  };
};

export const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'MESSAGE', message }));
  }
};
