package com.espe.messagingapp.config;

import com.espe.messagingapp.model.Message;
import com.espe.messagingapp.service.MessageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private MessageService messageService; // Inyecta el servicio que guarda los mensajes

    // Lista sincronizada para almacenar las sesiones activas
    private final Set<WebSocketSession> activeSessions = Collections.synchronizedSet(new HashSet<>());

    // Mapa para asociar sesiones con nombres de usuario
    private final Map<WebSocketSession, String> userSessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper(); // Para procesar JSON

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                System.out.println("Usuario conectado: " + session.getId());
                activeSessions.add(session);
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
                String payload = message.getPayload().toString();
                System.out.println("Mensaje recibido: " + payload);

                try {
                    // Parsear el mensaje JSON
                    Map<String, String> messageData = objectMapper.readValue(payload, Map.class);

                    if ("JOIN".equals(messageData.get("type"))) {
                        // Si el mensaje es de tipo "JOIN", guarda el nombre de usuario
                        String username = messageData.get("username");
                        userSessions.put(session, username);  // Guarda la sesión del usuario y su nombre
                        System.out.println("Usuario registrado: " + username + " en sesión " + session.getId());

                        // Notificar la lista actualizada de usuarios
                        notifyUsers(username, "conectó");
                    } else if ("MESSAGE".equals(messageData.get("type"))) {
                        messageService.saveMessage(new Message(payload));

                        // Enviar el mensaje a todos los usuarios conectados
                        broadcastMessage(payload);
                        System.out.println("Mensaje enviado a todos los usuarios.");

                    } else if ("PRIVATE_MESSAGE".equals(messageData.get("type"))) {
                        String recipientSessionId = messageData.get("toSession");  // Obtén la sesión del destinatario (si existe)
                        WebSocketSession recipientSession = findSessionById(recipientSessionId);

                        if (recipientSession != null) {
                            // Guarda el mensaje en MongoDB
                            messageService.saveMessage(new Message(payload));

                            // Enviar el mensaje al usuario destinatario
                            recipientSession.sendMessage(new TextMessage(payload));
                            System.out.println("Mensaje enviado a: " + recipientSessionId);
                        } else {
                            System.out.println("Sesion no encontrada.");
                        }

                    }
                } catch (Exception e) {
                    System.out.println("Error procesando mensaje: " + e.getMessage());
                }
            }

            // Función para encontrar la sesión por su ID
            private WebSocketSession findSessionById(String sessionId) {
                return userSessions.entrySet().stream()
                        .filter(entry -> entry.getKey().getId().equals(sessionId))
                        .map(Map.Entry::getKey)
                        .findFirst()
                        .orElse(null);
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
                System.out.println("Error en WebSocket: " + exception.getMessage());
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                String username = userSessions.remove(session);
                activeSessions.remove(session);
                if (username != null) {
                    System.out.println("Usuario desconectado: " + session.getId() + " (Usuario: " + username + ")");
                    // Notificar la lista actualizada de usuarios
                    notifyUsers(username, "desconectó");
                }
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;
            }

            // Método para enviar mensajes a todos los usuarios conectados
            private void broadcastMessage(String message) {
                synchronized (activeSessions) {
                    for (WebSocketSession session : activeSessions) {
                        if (session.isOpen()) {
                            try {
                                session.sendMessage(new TextMessage(message));
                            } catch (Exception e) {
                                System.out.println("Error enviando mensaje: " + e.getMessage());
                            }
                        }
                    }
                }
            }

            // Método para notificar a todos los usuarios de las sesiones actuales
            private void notifyUsers(String usernameChange, String action) throws JsonProcessingException {
                List<Map<String, Object>> userSessionsJson = new ArrayList<>(); // Lista de mapas, no de cadenas

                for (Map.Entry<WebSocketSession, String> entry : userSessions.entrySet()) {
                    WebSocketSession session = entry.getKey();
                    String username = entry.getValue();

                    // Realiza alguna acción con 'session' y 'username'
                    System.out.println("Sesion: " + session.getId() + ", Usuario: " + username);

                    // Agregar el mapa directamente, sin serializarlo a un string
                    userSessionsJson.add(Map.of(
                            "session", session.getId(),
                            "username", username
                    ));
                }

                try {
                    String usersMessage = objectMapper.writeValueAsString(Map.of(
                            "type", "USERS",
                            "users", userSessionsJson,
                            "message", "El usuario " + usernameChange + " se " + action + "."
                    ));

                    broadcastMessage(usersMessage);
                } catch (Exception e) {
                    System.out.println("Error enviando lista de usuarios: " + e.getMessage());
                }
            }
        }, "/ws").setAllowedOrigins("*"); // Se permite cualquier origen
    }
}
