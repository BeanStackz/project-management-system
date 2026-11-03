package com.beanstack.project_management_system.DTO;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 
public class IssueDTO {
    private Long id;
    private String title;
    private String description;
    private String status;
    private Long projectId;
    private String priority;
    private LocalDateTime dueDate;
    private List<String> tags = new ArrayList<>();
    private Project project;

    private User assignee;
}
