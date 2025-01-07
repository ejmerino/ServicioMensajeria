package com.espe.messagingapp.config;

import com.espe.messagingapp.model.Message;
import com.espe.messagingapp.service.MessageService;
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

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private MessageService messageService; // Inyecta el servicio que guarda los mensajes

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Registra un WebSocketHandler en la URL /ws
        registry.addHandler(new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                // Mensaje en el servidor cuando un usuario se conecta
                System.out.println("Usuario conectado: " + session.getId());
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
                // Log cuando se recibe un mensaje
                System.out.println("Mensaje recibido: " + message.getPayload());

                // Guarda el mensaje en MongoDB
                messageService.saveMessage(new Message(message.getPayload().toString()));

                // Envía el mensaje recibido de vuelta al cliente
                session.sendMessage(new TextMessage("Mensaje recibido: " + message.getPayload()));
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
                // Log cuando ocurre un error en la conexión WebSocket
                System.out.println("Error en WebSocket: " + exception.getMessage());
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                // Mensaje en el servidor cuando un usuario se desconecta
                System.out.println("Usuario desconectado: " + session.getId());
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;  // No soporta mensajes parciales
            }
        }, "/ws").setAllowedOrigins("*"); // Se permite cualquier origen
    }
}
