package com.beanstack.project_management_system.service;

import com.beanstack.project_management_system.model.Subscription;
import com.beanstack.project_management_system.model.User;

public interface SubscriptionService {
    
    Subscription createSubscription(User user) throws Exception;

    Subscription getUserSubscription(Long userId) throws Exception;

    Subscription upgradeSubscription(Long userId, String planType) throws Exception;

    boolean isValid(Subscription subscription) throws Exception;
}
