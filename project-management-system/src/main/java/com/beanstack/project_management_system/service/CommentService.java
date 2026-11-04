package com.beanstack.project_management_system.service;

import java.util.List;

import com.beanstack.project_management_system.model.Comment;

public interface CommentService {
    
    Comment createComment(Long issueId, Long userId, String content) throws Exception;
    
    void deleteComment(Long commentId, Long userId) throws Exception;

    List<Comment> getCommentsByIssueId(Long issueId) throws Exception;
}
