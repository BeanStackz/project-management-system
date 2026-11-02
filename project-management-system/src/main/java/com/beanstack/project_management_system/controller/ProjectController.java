package com.beanstack.project_management_system.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.Chat;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.response.MessageResponse;
import com.beanstack.project_management_system.service.ProjectService;
import com.beanstack.project_management_system.service.UserService;

@RestController 
@RequestMapping ("/api/projects")
public class ProjectController {
    
    private final ProjectService projectService;

    private final UserService userService;

    public ProjectController(ProjectService projectService, UserService userService) {
        this.projectService = projectService;
        this.userService = userService;
    }


    @GetMapping
    public ResponseEntity<List<Project>> getProject(@RequestParam(required = false) String category, 
            @RequestParam(required = false) String tag, 
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        List<Project> projects = projectService.getProjectByTeam(user, category, tag);
        return new ResponseEntity<>(projects, HttpStatus.OK);
        
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<Project> getProjectById(
        @PathVariable Long projectId, 
        @RequestHeader("Authorization") String jwt) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);
        Project projects = projectService.getProjectById(projectId);

        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Project> createProject(
        @PathVariable Long projectId, 
        @RequestHeader("Authorization") String jwt,
        @RequestBody Project project) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);
        Project createdProject = projectService.createProject(project, user.getId());

        return new ResponseEntity<>(createdProject, HttpStatus.OK);
    }

    @PatchMapping("/{projectId}")
    public ResponseEntity<Project> updateProject(
        @PathVariable Long projectId,
        @RequestHeader("Authorization") String jwt,
        @RequestBody Project project
    ) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Project updatedProject = projectService.updateProject(project, projectId);

        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<MessageResponse> deleteProject(
        @PathVariable Long projectId,
        @RequestHeader("Authorization") String jwt,
        @RequestBody Project project
    ) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        projectService.deleteProject(projectId, user.getId());
        MessageResponse messageResponse = new MessageResponse("Project deleted successfully");
        return new ResponseEntity<>(messageResponse, HttpStatus.OK);

    }

    @GetMapping("/search")
    public ResponseEntity<List<Project>> searchProjects(@RequestParam(required = false) String param,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        List<Project> projects = projectService.searchProjects(param, user);
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @GetMapping("/{projectId}/chat")
    public ResponseEntity<Chat> getChatByProjectIdEntity(@PathVariable Long projectId, @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Chat chat = projectService.getChatByProjectId(projectId);
        return new ResponseEntity<Chat>(chat, HttpStatus.OK);
    }
    
    
}
