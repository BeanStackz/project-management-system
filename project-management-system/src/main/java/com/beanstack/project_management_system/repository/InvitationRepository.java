package com.beanstack.project_management_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Invitation;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    
    Invitation findByToken(String token);
    
    Invitation findByUserEmail(String userEmail);
    
    void deleteByToken(String token);
    
}
