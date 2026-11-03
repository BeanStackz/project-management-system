package com.beanstack.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Issue;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    

    public List<Issue> findByProjectId(Long projectId);
}
