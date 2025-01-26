package com.espe.messagingapp.config;

import com.espe.messagingapp.model.Message;
import com.espe.messagingapp.service.MessageService;
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

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
                        userSessions.put(session, username);
                        System.out.println("Usuario registrado: " + username + " en sesión " + session.getId());

                        // Notificar la lista actualizada de usuarios
                        notifyUsers();
                    } else {
                        // Guarda el mensaje en MongoDB
                        messageService.saveMessage(new Message(payload));
                        // Envía el mensaje recibido a todos los usuarios conectados
                        broadcastMessage(payload);
                    }
                } catch (Exception e) {
                    System.out.println("Error procesando mensaje: " + e.getMessage());
                }
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
                System.out.println("Error en WebSocket: " + exception.getMessage());
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                String username = userSessions.remove(session);
                activeSessions.remove(session);
                System.out.println("Usuario desconectado: " + session.getId() + " (Usuario: " + username + ")");
                // Notificar la lista actualizada de usuarios
                notifyUsers();
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
            private void notifyUsers() {
                List<String> usernames = userSessions.values().stream().collect(Collectors.toList());
                try {
                    String usersMessage = objectMapper.writeValueAsString(Map.of(
                            "type", "USERS",
                            "users", usernames
                    ));

                    broadcastMessage(usersMessage);
                } catch (Exception e) {
                    System.out.println("Error enviando lista de usuarios: " + e.getMessage());
                }
            }
        }, "/ws").setAllowedOrigins("*"); // Se permite cualquier origen
    }
}
