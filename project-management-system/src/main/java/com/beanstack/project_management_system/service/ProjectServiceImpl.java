package com.beanstack.project_management_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;

@Service 
public class ProjectServiceImpl  implements ProjectService {

    @Override
    public void addUserToProject(Long projectId, Long userId) throws Exception {
        // TODO Auto-generated method stub
        
    }

    @Override
    public Project createProject(Project project, Long userId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void deleteProject(Long projectId, Long userId) throws Exception {
        // TODO Auto-generated method stub
        
    }

    @Override
    public Chat getChatByProjectId(Long projectId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public Project getProjectById(Long projectId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public List<Project> getProjectByTeam(User user, String category, String tag) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void removeUserFromProject(Long projectId, Long userId) throws Exception {
        // TODO Auto-generated method stub
        
    }

    @Override
    public Project updateProject(Project project, Long userId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    
    
}
