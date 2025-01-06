package com.espe.messagingapp.controller;

import com.espe.messagingapp.model.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MessageController {

    // Recibe el mensaje desde el cliente y lo reenvía a todos los suscriptores
    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public Message sendMessage(Message message) throws Exception {
        return message;  // El mensaje es enviado a los clientes suscritos
    }
}
