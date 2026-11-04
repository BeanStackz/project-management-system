package com.beanstack.project_management_system.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.PlanType;
import com.beanstack.project_management_system.model.Subscription;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.service.SubscriptionService;
import com.beanstack.project_management_system.service.UserService;

@RestController 
@RequestMapping ("/api/subscriptions")
public class SubscriptionController {
    
    private final SubscriptionService subscriptionService;
    private final UserService userService;

    public SubscriptionController(SubscriptionService subscriptionService, UserService userService) {
        this.subscriptionService = subscriptionService;
        this.userService = userService;
    }

    @GetMapping ("/user")
    public ResponseEntity<Subscription> getUserSubscription(@RequestHeader("Authorization") String jwt) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        Subscription subscription = subscriptionService.getUserSubscription(user.getId());
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }

    @PatchMapping ("/upgrade")
    public ResponseEntity<Subscription> upgradeSubscription(@RequestHeader("Authorization") String jwt, @RequestParam PlanType planType) throws Exception {
        jwt = jwt.replace("Bearer ", "");
        User user = userService.findUserProfileByJwt(jwt);
        Subscription subscription = subscriptionService.upgradeSubscription(user.getId(), planType.name());
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }
}
