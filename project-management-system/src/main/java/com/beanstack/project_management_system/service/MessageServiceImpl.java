package com.beanstack.project_management_system.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Message;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.MessageRepository;
import com.beanstack.project_management_system.repository.UserRepository;

@Service 
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    
    public MessageServiceImpl(MessageRepository messageRepository, UserRepository userRepository, ProjectService projectService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.projectService = projectService;
    }

    @Override
    public List<Message> getMessagesByUserId(Long userId) throws Exception {
        Chat chat = projectService.getChatByProjectId(userId);
        List<Message> messagesOrderedAsc = messageRepository.findByChatIdOrderByCreatedAtAsc(chat.getId());
        return messagesOrderedAsc;
    }

    @Override
    public Message sendMessage(Long senderId, Long projectId, String content) throws Exception {
        User sender = userRepository.findById(senderId).orElseThrow(() -> new Exception("User not found"));
        
        Project project = projectService.getProjectById(projectId);
        Chat chat = project.getChat();
        
        Message message = new Message();
        message.setSender(sender);
        message.setChat(chat);
        message.setCreatedAt(LocalDateTime.now());
        message.setContent(content);

        Message savedMessage = messageRepository.save(message);

        chat.getMessages().add(message);

        return savedMessage;
    }
    
}
