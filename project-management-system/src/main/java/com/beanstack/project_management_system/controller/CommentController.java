package com.beanstack.project_management_system.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.Comment;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.request.CreateCommentRequest;
import com.beanstack.project_management_system.service.CommentService;
import com.beanstack.project_management_system.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
        User user = userService.findUserProfileByJwt(jwt);
        Comment comment = commentService.createComment(
            createCommentRequest.getIssueId(),
            user.getId(),
            createCommentRequest.getContent()
        );
        return new ResponseEntity<>(comment, HttpStatus.CREATED);
    }
    
}
