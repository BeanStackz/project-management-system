package com.beanstack.project_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    
    
}
