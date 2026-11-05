package com.beanstack.project_management_system.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Issue;
import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.IssueRepository;
import com.beanstack.project_management_system.request.IssueRequest;

@Service 
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final ProjectService projectService;
    private final UserService userService;

    public IssueServiceImpl(IssueRepository issueRepository, ProjectService projectService, UserService userService) {
        this.issueRepository = issueRepository;
        this.projectService = projectService;
        this.userService = userService;
    }

    @Override
    public Issue addUserToIssue(Long issueId, Long userId) throws Exception {
        User user = userService.findUserById(userId);

        Issue issue = getIssueById(issueId);
        if (issue.getProject() == null || !issue.getProject().getTeam().contains(user)) {
            throw new Exception("Issue can only be assigned to a project team member");
        }
        issue.setAssignee(user);
        return issueRepository.save(issue);
    }

    @Override
    public Issue createIssue(IssueRequest issueRequest, User user) throws Exception {
        if (issueRequest == null || issueRequest.getProjectId() == null
                || issueRequest.getTitle() == null || issueRequest.getTitle().isBlank()) {
            throw new Exception("Issue title and project are required");
        }
        Project project = projectService.getProjectById(issueRequest.getProjectId());
        if (!project.getTeam().contains(user)) {
            throw new Exception("User is not a member of this project");
        }
        Issue issue = new Issue();
        issue.setTitle(issueRequest.getTitle());
        issue.setDescription(issueRequest.getDescription());
        issue.setStatus(issueRequest.getStatus());
        issue.setDueDate(issueRequest.getDueDate());
        issue.setPriority(issueRequest.getPriority() == null ? "NORMAL" : issueRequest.getPriority());
        issue.setProjectID(issueRequest.getProjectId());
        issue.setProject(project);
        return issueRepository.save(issue);
    }

    @Override
    public void deleteIssue(Long issueId, Long userId) throws Exception {
        getIssueById(issueId);
        issueRepository.deleteById(issueId);
    }

    @Override
    public Issue getIssueById(Long issueId) throws Exception {
        
        Optional<Issue> issue = issueRepository.findById(issueId);
        
        return issue.get();
    }

    @Override
    public List<Issue> getIssueByProjectId(Long projectId) throws Exception {
        return issueRepository.findByProjectId(projectId);
    }

    @Override
    public Issue updateStatus(Long issueId, String status) throws Exception {
        Issue issue = getIssueById(issueId);
        issue.setStatus(status);
        return issueRepository.save(issue);
    }
    
}
