package com.beanstack.project_management_system.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.ProjectRepository;


@Service 
public class ProjectServiceImpl  implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;
    private final ChatService chatService;

    public ProjectServiceImpl(ProjectRepository projectRepository, UserService userService, ChatService chatService) {
        this.projectRepository = projectRepository;
        this.userService = userService;
        this.chatService = chatService;
    }

    @Override
    @Transactional
    public void addUserToProject(Long projectId, Long userId) throws Exception {
        Project project = getProjectById(projectId);
        User user = userService.findUserById(userId);
        if(!project.getTeam().contains(user)) {
            if (project.getChat() == null) {
                throw new Exception("Project chat is not available");
            }
            project.getChat().getUsers().add(user);
            project.getTeam().add(user);
        }
        projectRepository.save(project);
    }

    @Override
    public Project createProject(Project project, Long userId) throws Exception {
        Project createdProject = new Project();

        createdProject.setName(project.getName());
        createdProject.setDescription(project.getDescription());
        createdProject.setCategory(project.getCategory());
        createdProject.setTags(project.getTags());
        // save to reduce the number of queries to the database
        User user = userService.findUserById(userId);
        createdProject.setOwner(user);
        createdProject.getTeam().add(user);

        Project savedProject = projectRepository.save(createdProject);

        Chat chat = new Chat();
        chat.setProject(savedProject);

        Chat projectChat = chatService.createChat(chat);
        savedProject.setChat(projectChat);

        

        return savedProject;
    }

    @Override
    public void deleteProject(Long projectId, Long userId) throws Exception {
        Project project = getProjectById(projectId);
        if (project.getOwner() == null || !project.getOwner().getId().equals(userId)) {
            throw new Exception("Only the project owner can delete this project");
        }
        projectRepository.deleteById(projectId);        
    }

    @Override
    public Chat getChatByProjectId(Long projectId) throws Exception {
        Project project = getProjectById(projectId);
        
        return project.getChat();
    }

    @Override
    public Project getProjectById(Long projectId) throws Exception {
        Optional<Project> project = projectRepository.findById(projectId);
        if(project.isEmpty()) {
            throw new Exception("Project not found with id: " + projectId);
        }
        return project.get();
    }

    @Override
    public List<Project> getProjectByTeam(User user, String category, String tag) throws Exception {
        List<Project> projects = projectRepository.findByTeamContainingOrOwner(user, user);
        if(category != null && !category.isEmpty()) {
            projects = projects.stream().filter(project -> project.getCategory().equals(category))
                .collect(Collectors.toList());
        }
        if(tag != null && !tag.isEmpty()) {
            projects = projects.stream().filter(project -> project.getTags().contains(tag))
                .collect(Collectors.toList());
        }
        return projects;
    }

    @Override
    public void removeUserFromProject(Long projectId, Long userId) throws Exception {
        Project project = getProjectById(projectId);
        User user = userService.findUserById(userId);
        if(project.getTeam().contains(user)) {
            project.getChat().getUsers().remove(user);
            project.getTeam().remove(user);
        }
        projectRepository.save(project);
    }

    @Override
    public Project updateProject(Project updatedProject, Long projectId) throws Exception {
        Project project = getProjectById(projectId);
        project.setName(updatedProject.getName());
        project.setDescription(updatedProject.getDescription());
        project.setTags(updatedProject.getTags());
        return projectRepository.save(project);
    }

    @Override 
    public List<Project> searchProjects(String keyword, User user) throws Exception {
        
        return projectRepository.findByNameContainingAndTeamContains(keyword, user);
    }

    
    
}
