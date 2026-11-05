package com.beanstack.project_management_system.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.model.PlanType;
import com.beanstack.project_management_system.model.Subscription;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.SubscriptionRespository;

@Service 
public class SubscriptionServiceImpl implements SubscriptionService {

    private final UserService userService;
    private final SubscriptionRespository subscriptionRespository;
    public SubscriptionServiceImpl(UserService userService, SubscriptionRespository subscriptionRespository) {
        this.userService = userService;
        this.subscriptionRespository = subscriptionRespository;
    }
    @Override
    public Subscription createSubscription(User user) throws Exception {
        
        Subscription subscription = new Subscription();

        subscription.setUser(user);
        subscription.setPlanType(PlanType.FREE);
        subscription.setValid(true);
        subscription.setSubscriptionStartDate(java.time.LocalDate.now());
        subscription.setSubscriptionEndDate(java.time.LocalDate.now().plusMonths(12));
        
        return subscriptionRespository.save(subscription);
    }

    @Override
    public Subscription getUserSubscription(Long userId) throws Exception {
        Subscription subscription = subscriptionRespository.findByUserId(userId);
        if (subscription == null || !isValid(subscription)) {
            if (subscription == null) {
                throw new Exception("Subscription not found for user with id: " + userId);
            }
            subscription.setPlanType(PlanType.FREE);
            subscription.setSubscriptionEndDate(LocalDate.now().plusMonths(12));
            subscription.setSubscriptionStartDate(LocalDate.now());
            subscription.setCancelAtPeriodEnd(false);

        }

        return subscriptionRespository.save(subscription);
    }

    @Override
    public boolean isValid(Subscription subscription) throws Exception {
        if(subscription.getPlanType().equals(PlanType.FREE)) {
            return true;
        }
        LocalDate endDate = subscription.getSubscriptionEndDate();
        LocalDate currentDate = LocalDate.now();

        return !endDate.isBefore(currentDate);
    }

    @Override
    public Subscription upgradeSubscription(Long userId, String planType) throws Exception {
        Subscription subscription = subscriptionRespository.findByUserId(userId);

        if(subscription == null) {
            throw new Exception("Subscription not found for user with id: " + userId);
        }
        
        subscription.setPlanType(PlanType.valueOf(planType));
        subscription.setCancelAtPeriodEnd(false);
        LocalDate startDate = LocalDate.now();
        subscription.setSubscriptionStartDate(startDate);
        subscription.setSubscriptionEndDate(
                startDate.plusMonths(PlanType.ANNUALLY.toString().equals(planType) ? 12 : 1));
        return subscriptionRespository.save(subscription);
    }

    @Override
    public Subscription cancelSubscription(Long userId) throws Exception {
        Subscription subscription = subscriptionRespository.findByUserId(userId);
        if (subscription == null) {
            throw new Exception("Subscription not found for user with id: " + userId);
        }
        if (subscription.getPlanType().equals(PlanType.FREE)) {
            return subscription;
        }

        subscription.setCancelAtPeriodEnd(true);
        return subscriptionRespository.save(subscription);
    }
    
}
