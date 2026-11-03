package com.beanstack.project_management_system.service;

import com.beanstack.project_management_system.model.Invitation;

public interface InvitationService {

    public void sendInvitation(String userEmail, Long projectId) throws Exception;

    public Invitation acceptInvitation(String token, Long userId) throws Exception;

    public String getTokenByUserMail(String userEmail) throws Exception;

    void deleteToken(String token) throws Exception;

}
