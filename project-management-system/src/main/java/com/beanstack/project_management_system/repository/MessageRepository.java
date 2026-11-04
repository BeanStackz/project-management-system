package com.beanstack.project_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Message;


public interface MessageRepository  extends JpaRepository<Message, Long> {
    
    
}
