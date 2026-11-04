package com.beanstack.project_management_system.service;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Invitation;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.repository.InvitationRepository;

import jakarta.mail.MessagingException;


@Service 
public class InvitationServiceImpl implements InvitationService {


    @Value("${pms.mail.base-url-frontend}")
    private String baseUrlFrontend;

    private final InvitationRepository invitationRepository;
    private final EmailService emailService;
    private final ProjectService projectService;
    
    public InvitationServiceImpl(InvitationRepository invitationRepository, EmailService emailService,
            ProjectService projectService) {
        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
        this.projectService = projectService;
    }

    @Override
    public Invitation acceptInvitation(String token, Long userId) throws Exception {
        Invitation invitation = invitationRepository.findByToken(token);
        if(invitation == null) {
            throw new Exception("Invalid invitation token");
        }

        return invitation;
    }

    @Override
    public void deleteToken(String token) throws Exception {
        
        Invitation invitation = invitationRepository.findByToken(token);
        if(invitation == null) {
            throw new Exception("Invalid invitation token");
        }
        invitationRepository.deleteByToken(token);
        
    }

    @Override
    public String getTokenByUserMail(String userEmail) throws Exception {
        
        Invitation invitation = invitationRepository.findByEmail(userEmail);
        if(invitation == null) {
            throw new Exception("No invitation found for the provided email");
        }
        return invitation.getToken();
    }

    @Override
    public void sendInvitation(String userEmail, Long projectId) throws MessagingException {
        String invitationToken = UUID.randomUUID().toString();
        Invitation invitation = new Invitation();
        invitation.setEmail(userEmail);
        invitation.setProjectId(projectId);
        invitation.setToken(invitationToken);
        
        try {
            Project project = projectService.getProjectById(projectId);
            String invitationLink = baseUrlFrontend + "/accept-invitation?token=" + invitationToken;
            emailService.sendEmailWithToken(userEmail, invitationLink, project.getName());
        } catch (Exception e) {
            throw new MessagingException("Error occurred while sending invitation email", e);
        }
        invitationRepository.save(invitation);
        
    }
    
    
    
}
