package com.beanstack.project_management_system.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.config.JwtProvider;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.UserRepository;

@Service 
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User findUserProfileByJwt(String jwt) throws Exception {
        
        String email = JwtProvider.getEmailFromToken(jwt);
        return findUserByEmail(email);
    }

    @Override
    public User findUserByEmail(String email) throws Exception {
        User user = userRepository.findByEmail(email);
        if(user == null) {
            throw new Exception("User not found with email: " + email);
        }
        return user;
    }

    @Override
    public User findUserById(Long userId) throws Exception {
        Optional<User> user = userRepository.findById(userId);
        if(user.isEmpty()) {
            throw new Exception("User not found with id: " + userId);
        }
        return user.get();
    }

    @Override
    public User updateUsersProjectSize(User user, int projectSize) throws Exception {
        user.setProjectSize(user.getProjectSize() + projectSize);
        
        return userRepository.save(user);
    }
    
}
