package com.espe.messagingapp.controller;

import com.espe.messagingapp.model.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class MessageController {

    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat")  // Cuando el cliente envía un mensaje a /app/chat
    public void sendMessage(Message message) {
        messagingTemplate.convertAndSend("/topic/messages", message);  // Envía el mensaje a /topic/messages
    }
}
