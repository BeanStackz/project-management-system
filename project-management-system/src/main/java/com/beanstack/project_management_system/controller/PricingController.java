package com.beanstack.project_management_system.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.beanstack.project_management_system.model.PlanType;
import com.beanstack.project_management_system.response.PricingPlanResponse;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    @GetMapping
    public List<PricingPlanResponse> getPlans() {
        return List.of(
                new PricingPlanResponse(
                        PlanType.FREE,
                        "Free",
                        0,
                        0,
                        0,
                        List.of("1 active project", "Basic issue tracking", "Project chat")),
                new PricingPlanResponse(
                        PlanType.MONTHLY,
                        "Pro",
                        799,
                        799,
                        0,
                        List.of("Unlimited projects", "Advanced issue tracking", "Team collaboration", "Priority support")),
                new PricingPlanResponse(
                        PlanType.ANNUALLY,
                        "Pro annual",
                        799,
                        6712,
                        30,
                        List.of("Unlimited projects", "Advanced issue tracking", "Team collaboration", "Priority support")));
    }
}
