package com.beanstack.project_management_system.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Data 
@AllArgsConstructor 
@NoArgsConstructor 
public class Comment {
    
    @Id 
    @GeneratedValue (strategy = jakarta.persistence.GenerationType.AUTO)    
    private Long id;

    private String content;

    private LocalDateTime createdAt;

    @ManyToOne
    private User user;
    
    @ManyToOne
    private Issue issue;
}
