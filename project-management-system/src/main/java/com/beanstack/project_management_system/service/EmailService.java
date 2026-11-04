package com.beanstack.project_management_system.service;

public interface EmailService {
    
    void sendEmailWithToken(String userEmail, String link, String projectName) throws Exception;
    
}
