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
import com.beanstack.project_management_system.model.Invitation;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.request.InviteRequest;
import com.beanstack.project_management_system.response.MessageResponse;
import com.beanstack.project_management_system.service.InvitationService;
import com.beanstack.project_management_system.service.ProjectService;
import com.beanstack.project_management_system.service.UserService;

@RestController 
@RequestMapping ("/api/projects")
public class ProjectController {
    
    private final ProjectService projectService;
    private final InvitationService invitationService;

    private final UserService userService;

    public ProjectController(ProjectService projectService, UserService userService, InvitationService invitationService) {
        this.projectService = projectService;
        this.invitationService = invitationService;
        this.userService = userService;
    }


    @GetMapping
    public ResponseEntity<List<Project>> getProject(@RequestParam(required = false) String category, 
            @RequestParam(required = false) String tag, 
            @RequestHeader("Authorization") String jwt) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        List<Project> projects = projectService.getProjectByTeam(user, category, tag);
        return new ResponseEntity<>(projects, HttpStatus.OK);
        
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<Project> getProjectById(
        @PathVariable Long projectId, 
        @RequestHeader("Authorization") String jwt) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        if(!projectService.getProjectById(projectId).getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }
        Project projects = projectService.getProjectById(projectId);
        if(projects == null) {
            throw new Exception("Project not found");
        }

        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Project> createProject(
        @RequestHeader("Authorization") String jwt,
        @RequestBody Project project) throws Exception {

        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        Project createdProject = projectService.createProject(project, user.getId());

        if(createdProject == null) {
            throw new Exception("Project not created");
        }
        // System.out.println("Project created successfully: " + createdProject.getName());
        // System.out.println("Project ID: " + createdProject.getId());

        return new ResponseEntity<>(createdProject, HttpStatus.OK);
    }

    @PatchMapping("/{projectId}")
    public ResponseEntity<Project> updateProject(
        @PathVariable Long projectId,
        @RequestHeader("Authorization") String jwt,
        @RequestBody Project project
    ) throws Exception {

        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        if(!projectService.getProjectById(projectId).getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }
        Project updatedProject = projectService.updateProject(project, projectId);

        return new ResponseEntity<>(updatedProject, HttpStatus.OK);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<MessageResponse> deleteProject(
        @PathVariable Long projectId,
        @RequestHeader("Authorization") String jwt,
        @RequestBody(required = false) Project project
    ) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        projectService.deleteProject(projectId, user.getId());
        MessageResponse messageResponse = new MessageResponse("Project deleted successfully");
        return new ResponseEntity<>(messageResponse, HttpStatus.OK);

    }

    @GetMapping("/search")
    public ResponseEntity<List<Project>> searchProjects(@RequestParam(required = false) String keyword,
            @RequestHeader("Authorization") String jwt) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        List<Project> projects = projectService.searchProjects(keyword, user);
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @GetMapping("/{projectId}/chat")
    public ResponseEntity<Chat> getChatByProjectIdEntity(@PathVariable Long projectId, @RequestHeader("Authorization") String jwt) throws Exception {
        
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        if(!projectService.getProjectById(projectId).getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }
        Chat chat = projectService.getChatByProjectId(projectId);
        return new ResponseEntity<Chat>(chat, HttpStatus.OK);
    }

    @PostMapping("/invite")
    public ResponseEntity<MessageResponse> inviteProject(@RequestHeader("Authorization") String jwt,
     @RequestBody InviteRequest inviteRequest
    ) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        if (inviteRequest == null || inviteRequest.getProjectId() == null
                || inviteRequest.getEmail() == null || inviteRequest.getEmail().isBlank()) {
            throw new Exception("Project id and email are required");
        }
        Project project = projectService.getProjectById(inviteRequest.getProjectId());
        if (!project.getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }
        invitationService.sendInvitation(inviteRequest.getEmail(), inviteRequest.getProjectId());
        MessageResponse messageResponse = new MessageResponse("Invitation sent successfully");
        return new ResponseEntity<>(messageResponse, HttpStatus.OK);
    }

    @GetMapping("/accept-invitation")
    public ResponseEntity<Invitation> acceptInvite(@RequestParam String token,
         @RequestHeader("Authorization") String jwt) throws Exception {

            jwt = jwt.replace("Bearer ", "");
            User user = userService.findUserProfileByJwt(jwt);
            Invitation invitation = invitationService.acceptInvitation(token, user.getId());
            projectService.addUserToProject(invitation.getProjectId(), user.getId());
            invitationService.deleteToken(token);
            return new ResponseEntity<>(invitation, HttpStatus.ACCEPTED);
    }
    
    
    
    
}
