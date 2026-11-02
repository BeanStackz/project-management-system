package com.beanstack.project_management_system.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Entity 
@Data 
public class Issue {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.AUTO)
    private Long id;


    private String title;
    private String description;
    private String status;
    private Long projectID;
    private String priority;
    private LocalDateTime createdAt;
    private List<String> tags = new ArrayList<>();

    @ManyToOne 
    private User assignee;

    @ManyToOne 
    @JsonIgnore 
    private Project project;
    
    @JsonIgnore 
    @OneToMany (mappedBy = "issue", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

}