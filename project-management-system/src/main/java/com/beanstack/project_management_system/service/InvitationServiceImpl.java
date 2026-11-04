package com.beanstack.project_management_system.service;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.beanstack.project_management_system.model.Invitation;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.InvitationRepository;

import jakarta.mail.MessagingException;


@Service 
public class InvitationServiceImpl implements InvitationService {


    @Value("${pms.mail.base-url-frontend}")
    private String baseUrlFrontend;

    private final InvitationRepository invitationRepository;
    private final EmailService emailService;
    private final ProjectService projectService;
    private final UserService userService;
    
    public InvitationServiceImpl(InvitationRepository invitationRepository, EmailService emailService,
            ProjectService projectService, UserService userService) {
        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
        this.projectService = projectService;
        this.userService = userService;
    }

    @Override
    public Invitation acceptInvitation(String token, Long userId) throws Exception {
        Invitation invitation = invitationRepository.findByToken(token);
        if(invitation == null) {
            throw new Exception("Invalid invitation token");
        }

        User user = userService.findUserById(userId);
        if (!invitation.getEmail().equalsIgnoreCase(user.getEmail())) {
            throw new Exception("This invitation was sent to a different email address");
        }

        return invitation;
    }

    @Override
    @Transactional
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
    public void sendInvitation(String userEmail, Long projectId) throws Exception {
        String normalizedEmail = userEmail == null ? null : userEmail.trim();
        if (normalizedEmail == null || normalizedEmail.isEmpty()) {
            throw new Exception("Email is required");
        }

        userService.findUserByEmail(normalizedEmail);

        String invitationToken = UUID.randomUUID().toString();
        Invitation invitation = new Invitation();
        invitation.setEmail(normalizedEmail);
        invitation.setProjectId(projectId);
        invitation.setToken(invitationToken);

        try {
            Project project = projectService.getProjectById(projectId);
            String invitationLink = baseUrlFrontend + "/#accept-invitation?token=" + invitationToken;
            emailService.sendEmailWithToken(normalizedEmail, invitationLink, project.getName());
        } catch (Exception e) {
            throw new MessagingException("Error occurred while sending invitation email", e);
        }
        invitationRepository.save(invitation);
        
    }
    
    
    
}
