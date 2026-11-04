package com.beanstack.project_management_system.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor 
public class CreateMessageRequest {
  
    private Long senderId;
    private Long projectId;
    private String content;
}
