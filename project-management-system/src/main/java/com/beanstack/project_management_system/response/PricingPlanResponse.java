package com.beanstack.project_management_system.response;

import java.util.List;

import com.beanstack.project_management_system.model.PlanType;

public record PricingPlanResponse(
        PlanType planType,
        String name,
        int monthlyPrice,
        int annualPrice,
        int annualDiscountPercent,
        List<String> features) {
}
