package com.beanstack.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Message;


public interface MessageRepository  extends JpaRepository<Message, Long> {
    
    List<Message> findByChatIdOrderByCreatedAtAsc(Long chatId);
}
