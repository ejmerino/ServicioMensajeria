package com.espe.messagingapp.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.espe.messagingapp.model.Message;

@RestController
public class MessageController {

    @PostMapping("/send-message")
    public String sendMessage(@RequestBody Message message) {
        // Aquí puedes guardar el mensaje en la base de datos o realizar otras acciones
        return "Mensaje recibido: " + message.getContent();
    }
}
