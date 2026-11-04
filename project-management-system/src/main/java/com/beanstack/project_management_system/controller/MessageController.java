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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Message;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.request.CreateMessageRequest;
import com.beanstack.project_management_system.service.MessageService;
import com.beanstack.project_management_system.service.ProjectService;
import com.beanstack.project_management_system.service.UserService;

@RestController
@RequestMapping ("/api/messages") 
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
        @RequestBody CreateMessageRequest request,
        @RequestHeader("Authorization") String jwt
    ) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        if (request.getContent() == null || request.getContent().isBlank() || request.getProjectId() == null) {
            throw new Exception("Project and message content are required");
        }
        Chat projectChat = projectService.getChatByProjectId(request.getProjectId());
        if (projectChat.getProject() == null || !projectChat.getProject().getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }

        Chat chat = projectChat;
        if(chatRepository.findById(chat.getId()).isEmpty()) {
            throw new Exception("Chat not found");
        }
        
        Message sentMessage = messageService.sendMessage(user.getId(), request.getProjectId(), request.getContent());
        return new ResponseEntity<>(sentMessage, HttpStatus.CREATED);
    }

    @GetMapping("/chat/{projectId}")
    public ResponseEntity<List<Message>> getMessagesByChatId(@PathVariable Long projectId,
        @RequestHeader("Authorization") String jwt) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        Chat chat = projectService.getChatByProjectId(projectId);
        if (chat.getProject() == null || !chat.getProject().getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }
        if(chatRepository.findById(chat.getId()).isEmpty()) {
            throw new Exception("Chat not found");
        }
        List<Message> messages = messageService.getMessagesByUserId(projectId);
        return new ResponseEntity<>(messages, HttpStatus.OK);
    }
}
