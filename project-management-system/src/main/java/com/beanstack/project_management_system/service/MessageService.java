package com.beanstack.project_management_system.service;

import java.util.List;

import com.beanstack.project_management_system.model.Message;

public interface MessageService {
    
    Message sendMessage(Long senderId, Long chatId, String content) throws Exception;

    List<Message> getMessagesByUserId(Long userId) throws Exception;
}
