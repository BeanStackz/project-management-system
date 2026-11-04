package com.beanstack.project_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Subscription;

public interface SubscriptionRespository extends JpaRepository<Subscription, Long> {
    
    Subscription findByUserId(Long userId);
}
