package com.beanstack.project_management_system.service;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.repository.ChatRepository;

import jakarta.transaction.Transactional;

@Service 
public class ChatServiceImpl implements ChatService {
    
    private ChatRepository chatRepository;
    
    
    public ChatServiceImpl(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }
    @Transactional
    @Override
    public Chat createChat(Chat chat) throws Exception {
        
        chatRepository.save(chat);
        return chat;
    }
}
