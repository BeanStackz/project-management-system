package com.beanstack.project_management_system.request;

import lombok.Data;

/**
 * LoginRequest
 */
@Data
public class LoginRequest {

    private String email;
    private String password;

}
