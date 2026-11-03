package com.beanstack.project_management_system.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.DTO.IssueDTO;
import com.beanstack.project_management_system.model.Issue;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.request.IssueRequest;
import com.beanstack.project_management_system.service.IssueService;
import com.beanstack.project_management_system.service.UserService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;


@RestController 
@RequestMapping("/api/issues")
public class IssueController {

    private IssueService issueService;
    private UserService userService;
    
    public IssueController(IssueService issueService, UserService userService) {
        this.issueService = issueService;
        this.userService = userService;
    }

    @GetMapping("/{issueId}")
    public ResponseEntity<Issue> getIssueById(@PathVariable Long issueId) throws Exception {
        // check later
        return new ResponseEntity<Issue>(issueService.getIssueById(issueId), HttpStatus.OK);
    }


    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Issue>> getIssueByProjectId(@PathVariable Long projectId) throws Exception {
        return new ResponseEntity<List<Issue>>(issueService.getIssueByProjectId(projectId), HttpStatus.OK);
    }
    

    @PostMapping
    public ResponseEntity<IssueDTO> createIssue(@RequestBody IssueRequest issueRequest, @RequestHeader ("Authorization") String jwt) throws Exception {
        User tokenUser = userService.findUserProfileByJwt(jwt);
        User user = userService.findUserById(tokenUser.getId());

        Issue issue = issueService.createIssue(issueRequest, user);
        IssueDTO issueDTO = new IssueDTO();
        issueDTO.setDescription(issue.getDescription());
        issueDTO.setDueDate(issue.getDueDate());
        issueDTO.setId(issue.getId());
        issueDTO.setPriority(issue.getPriority());
        issueDTO.setProjectId(issue.getProjectID());
        issueDTO.setProject(issue.getProject());
        issueDTO.setStatus(issue.getStatus());
        issueDTO.setTitle(issue.getTitle());
        issueDTO.setTags(issue.getTags());
        issueDTO.setAssignee(issue.getAssignee());
        

        return new ResponseEntity<IssueDTO>(issueDTO, HttpStatus.CREATED);

    }
    
}
