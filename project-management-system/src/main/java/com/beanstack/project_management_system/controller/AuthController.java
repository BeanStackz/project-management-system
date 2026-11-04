package com.beanstack.project_management_system.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.config.JwtProvider;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.UserRepository;
import com.beanstack.project_management_system.request.LoginRequest;
import com.beanstack.project_management_system.response.AuthResponse;
import com.beanstack.project_management_system.service.CustomUserDetailsImpl;
import com.beanstack.project_management_system.service.SubscriptionService;

import jakarta.transaction.Transactional;

@RestController 
@RequestMapping("/auth")
public class AuthController {
    private final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsImpl customUserDetailsImpl;
    private final SubscriptionService subscriptionService;
    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, CustomUserDetailsImpl customUserDetailsImpl, SubscriptionService subscriptionService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.customUserDetailsImpl = customUserDetailsImpl;
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (user == null || isBlank(user.getFullName()) || isBlank(user.getEmail()) || isBlank(user.getPassword())) {
            return ResponseEntity.badRequest().body("Name, email, and password are required.");
        }
        // Check if the email already exists
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Email is already in use.");
        }

        User createdUser = new User();
        createdUser.setFullName(user.getFullName());
        createdUser.setEmail(user.getEmail());
        createdUser.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(createdUser);

        // Create a new subscription for the newly registered user
        try {
            subscriptionService.createSubscription(createdUser);
        } catch (Exception e) {
            logger.error("Error creating subscription for newly registered user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating subscription");
        }

        // Create Authentication object for the newly registered user
        Authentication auth = new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword());
        SecurityContextHolder.getContext().setAuthentication(auth);

        String  jwt = JwtProvider.generateToken(auth);

        AuthResponse res = new AuthResponse();
        res.setMessage("Sign up success");
        res.setJwt(jwt);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        if (loginRequest == null || isBlank(loginRequest.getEmail()) || isBlank(loginRequest.getPassword())) {
            return ResponseEntity.badRequest().body("Email and password are required.");
        }

        String username = loginRequest.getEmail();
        String password = loginRequest.getPassword();
        Authentication auth = authenticate(username, password);
        SecurityContextHolder.getContext().setAuthentication(auth);

        String jwt = JwtProvider.generateToken(auth);

        AuthResponse res = new AuthResponse();
        res.setMessage("Login success");
        res.setJwt(jwt);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }


    private Authentication authenticate(String username, String password) {
        UserDetails user = customUserDetailsImpl.loadUserByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            logger.warn("Authentication failed");
            throw new RuntimeException("Invalid username or password");
        }

        
        return new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword(), user.getAuthorities());
    }
    private boolean isBlank(String value) {
            return value == null || value.trim().isEmpty();
        }




}
