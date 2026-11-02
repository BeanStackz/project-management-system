package com.beanstack.project_management_system.service;

import java.util.List;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;

public interface ProjectService {

    Project createProject(Project project, Long userId) throws Exception;
    List<Project> getProjectByTeam(User user, String category, String tag) throws Exception;
    
    Project getProjectById(Long projectId) throws Exception;

    void deleteProject(Long projectId, Long userId) throws Exception;

    Project updateProject(Project project, Long userId) throws Exception;

    void addUserToProject(Long projectId, Long userId) throws Exception;

    void removeUserFromProject(Long projectId, Long userId) throws Exception;

    Chat getChatByProjectId(Long projectId) throws Exception;
}
