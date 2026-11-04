package com.beanstack.project_management_system.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.Comment;
import com.beanstack.project_management_system.model.Issue;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.CommentRepository;
import com.beanstack.project_management_system.repository.IssueRepository;
import com.beanstack.project_management_system.repository.UserRepository;

@Service 
public class CommentServiceImpl implements CommentService {

    private CommentRepository commentRepository;
    private IssueService issueService;
    private IssueRepository issueRepository;
    private UserRepository userRepository;

    public CommentServiceImpl(CommentRepository commentRepository, IssueService issueService, IssueRepository issueRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.issueService = issueService;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Comment createComment(Long issueId, Long userId, String content) throws Exception {
        Optional<Issue> issueOpt = issueRepository.findById(issueId);
        Optional<User> userOpt = userRepository.findById(userId);
        if(issueOpt.isEmpty()) {
            throw new Exception("Issue not found with id: " + issueId);
        }
        if(userOpt.isEmpty()) {
            throw new Exception("User not found with id: " + userId);
        }
        Issue issue = issueOpt.get();
        User user = userOpt.get();

        Comment comment = new Comment();
        comment.setIssue(issue);
        comment.setUser(user);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setContent(content);

        Comment savedComment = commentRepository.save(comment);
        issue.getComments().add(savedComment);
        return savedComment;
    }

    @Override
    public void deleteComment(Long commentId, Long userId) throws Exception {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        Optional<User> userOpt = userRepository.findById(userId);
        if(commentOpt.isEmpty()) {
            throw new Exception("Comment not found with id: " + commentId);
        }
        if(userOpt.isEmpty()) {
            throw new Exception("User not found with id: " + userId);
        }
        Comment comment = commentOpt.get();
        User user = userOpt.get();
        if(!comment.getUser().getId().equals(user.getId())) {
            throw new Exception("User is not authorized to delete this comment");
        }
        commentRepository.delete(comment);
    }

    @Override
    public List<Comment> getCommentsByIssueId(Long issueId) throws Exception {
        return commentRepository.findCommentsByIssueId(issueId);
    }
    

}
