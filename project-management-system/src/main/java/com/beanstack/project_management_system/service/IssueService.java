package com.beanstack.project_management_system.service;

import java.util.List;
import java.util.Optional;

import com.beanstack.project_management_system.model.Issue;
import com.beanstack.project_management_system.request.IssueRequest;

public interface IssueService {
    
    Optional<Issue> getIssueById(Long issueId) throws Exception;

    List<Issue> getIssueByProjectId(Long projectId) throws Exception;
    
    Issue createIssue(IssueRequest issueRequest, Long userId) throws Exception;

    // Optional<Issue> updateIssue(IssueRequest issueRequest, Long issueId, Long userId) throws Exception;

    String deleteIssue(Long issueId, Long userId) throws Exception;

    // List<Issue> getIssuesByAssigneeId(Long assigneeId) throws Exception;

    // List<Issue> searchIssues(String title, String status, String priority, Long assigneeId) throws Exception;

    // List<Issue> getAssigneeForIssue(Long issueId) throws Exception;

    Issue addUserToIssue(Long issueId, Long userId) throws Exception;

    Issue updateStatus(Long issueId, String status) throws Exception;

}
