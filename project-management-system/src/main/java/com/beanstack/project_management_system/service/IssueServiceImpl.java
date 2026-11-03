package com.beanstack.project_management_system.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Issue;
import com.beanstack.project_management_system.repository.IssueRepository;
import com.beanstack.project_management_system.request.IssueRequest;

@Service 
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;

    public IssueServiceImpl(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    @Override
    public Issue addUserToIssue(Long issueId, Long userId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public Issue createIssue(IssueRequest issueRequest, Long userId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public String deleteIssue(Long issueId, Long userId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public Optional<Issue> getIssueById(Long issueId) throws Exception {
        
        Optional<Issue> issue = issueRepository.findById(issueId);
        if(issue.isEmpty()) {
            throw new Exception("Issue not found with id: " + issueId);
        }
        return issue;
    }

    @Override
    public List<Issue> getIssueByProjectId(Long projectId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public Issue updateStatus(Long issueId, String status) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }
    
}
