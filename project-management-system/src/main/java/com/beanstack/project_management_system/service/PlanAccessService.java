package com.beanstack.project_management_system.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.beanstack.project_management_system.exception.PlanFeatureException;
import com.beanstack.project_management_system.model.PlanType;
import com.beanstack.project_management_system.model.Subscription;
import com.beanstack.project_management_system.model.User;
import com.beanstack.project_management_system.repository.ProjectRepository;
import com.beanstack.project_management_system.repository.SubscriptionRespository;

@Service
public class PlanAccessService {

    private final SubscriptionRespository subscriptionRepository;
    private final ProjectRepository projectRepository;

    public PlanAccessService(
            SubscriptionRespository subscriptionRepository,
            ProjectRepository projectRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.projectRepository = projectRepository;
    }

    public boolean isPro(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId);
        return subscription != null
                && subscription.getPlanType() != PlanType.FREE
                && subscription.getSubscriptionEndDate() != null
                && !subscription.getSubscriptionEndDate().isBefore(LocalDate.now());
    }

    public void requireProjectCreation(User user) throws PlanFeatureException {
        if (!isPro(user.getId()) && projectRepository.countByOwnerId(user.getId()) >= 1) {
            throw new PlanFeatureException("The Free plan includes 1 active project. Upgrade to Pro to create more.");
        }
    }

    public void requireTeamCollaboration(User user) throws PlanFeatureException {
        if (!isPro(user.getId())) {
            throw new PlanFeatureException("Team collaboration is available on Pro plans.");
        }
    }

    public void requireAdvancedIssueTracking(User user) throws PlanFeatureException {
        if (!isPro(user.getId())) {
            throw new PlanFeatureException("Advanced issue tracking is available on Pro plans.");
        }
    }
}
