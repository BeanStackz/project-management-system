package com.beanstack.project_management_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Comment;
import com.beanstack.project_management_system.repository.CommentRepository;
import com.beanstack.project_management_system.repository.UserRepository;

@Service 
public class CommentServiceImpl implements CommentService {

    private CommentRepository commentRepository;
    private IssueService issueService;
    private UserRepository userRepository;

    public CommentServiceImpl(CommentRepository commentRepository, IssueService issueService, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.issueService = issueService;
        this.userRepository = userRepository;
    }

    @Override
    public Comment createComment(Long issueId, Long userId, String content) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void deleteComment(Long commentId, Long userId) throws Exception {
        // TODO Auto-generated method stub
        
    }

    @Override
    public List<Comment> getCommentsByIssueId(Long issueId) throws Exception {
        // TODO Auto-generated method stub
        return null;
    }
    

}
