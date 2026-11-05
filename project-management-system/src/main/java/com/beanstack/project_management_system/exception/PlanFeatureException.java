package com.beanstack.project_management_system.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class PlanFeatureException extends Exception {

    public PlanFeatureException(String message) {
        super(message);
    }
}
