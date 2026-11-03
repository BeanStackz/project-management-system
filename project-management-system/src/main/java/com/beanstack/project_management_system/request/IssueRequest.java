package com.beanstack.project_management_system.request;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 
public class IssueRequest {
    
    private String title;
    private String description;
    private String status;
    private Long projectId;
    private String priority;
    private LocalDateTime dueDate;

}
