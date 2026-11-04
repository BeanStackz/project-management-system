package com.beanstack.project_management_system.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.service.UserService;

@RestController 
@RequestMapping ("/api/users")
public class UserController {
    
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @RequestMapping("/profile")
    public ResponseEntity<User> getUserProfile(@RequestHeader("Authorization") String jwt) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
}
