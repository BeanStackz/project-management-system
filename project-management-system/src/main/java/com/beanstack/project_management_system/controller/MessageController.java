package com.beanstack.project_management_system.controller;

import com.beanstack.project_management_system.repository.ChatRepository;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Message;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.request.CreateMessageRequest;
import com.beanstack.project_management_system.service.MessageService;
import com.beanstack.project_management_system.service.ProjectService;
import com.beanstack.project_management_system.service.UserService;

@RestController 
public class MessageController {
    private final ChatRepository chatRepository;
    private final MessageService messageService;
    private final UserService userService;
    private final ProjectService projectService;

    public MessageController(MessageService messageService, UserService userService, ProjectService projectService, ChatRepository chatRepository) {
        this.messageService = messageService;
        this.userService = userService;
        this.projectService = projectService;
        this.chatRepository = chatRepository;
    }

    @PostMapping ("/send")
    public ResponseEntity<Message> sendMessage(
        @RequestBody CreateMessageRequest request
    ) throws Exception {
        User user = userService.findUserById(request.getSenderId());

        Chat chat = projectService.getChatByProjectId(request.getProjectId());
        if(chatRepository.findById(chat.getId()).isEmpty()) {
            throw new Exception("Chat not found");
        }
        
        Message sentMessage = messageService.sendMessage(request.getSenderId(), request.getProjectId(), request.getContent());
        return new ResponseEntity<>(sentMessage, HttpStatus.CREATED);
    }

    @GetMapping("/chat/{projectId}")
    public ResponseEntity<List<Message>> getMessagesByChatId(@PathVariable Long projectId) throws Exception {
        Chat chat = projectService.getChatByProjectId(projectId);
        if(chatRepository.findById(chat.getId()).isEmpty()) {
            throw new Exception("Chat not found");
        }
        List<Message> messages = messageService.getMessagesByUserId(projectId);
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }
}
