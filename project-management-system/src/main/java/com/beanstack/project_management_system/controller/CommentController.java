package com.beanstack.project_management_system.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.Comment;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.request.CreateCommentRequest;
import com.beanstack.project_management_system.service.CommentService;
import com.beanstack.project_management_system.service.UserService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;


@RestController 
@RequestMapping ("/api/comments")
public class CommentController {

    private CommentService commentService;
    private UserService userService;

    public CommentController(CommentService commentService, UserService userService) {
        this.commentService = commentService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(
        @RequestBody CreateCommentRequest createCommentRequest,
        @RequestHeader ("Authorization") String jwt
    ) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        Comment comment = commentService.createComment(
            createCommentRequest.getIssueId(),
            user.getId(),
            createCommentRequest.getContent()
        );
        return new ResponseEntity<>(comment, HttpStatus.CREATED);
    }

    @DeleteMapping ("/{commentId}")
    public ResponseEntity<String> deleteComment(
        @RequestHeader ("Authorization") String jwt,
        @PathVariable Long commentId
    ) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        commentService.deleteComment(commentId, user.getId());
        return new ResponseEntity<>("Comment deleted successfully", HttpStatus.OK);
    }

    @GetMapping ("/{issueId}")
    public ResponseEntity<List<Comment>> getCommentsByIssueId(@PathVariable Long issueId) throws Exception{
        List<Comment> comments = commentService.getCommentsByIssueId(issueId);
        return new ResponseEntity<>(comments, HttpStatus.OK);
    }

}