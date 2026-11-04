package com.beanstack.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.beanstack.project_management_system.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    List<Comment> findCommentsByIssueId(Long issueId);
}
