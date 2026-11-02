package com.beanstack.project_management_system.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Entity 
public class Invitation {
    
    @Id 
    @GeneratedValue (strategy = jakarta.persistence.GenerationType.AUTO)
    private Long id;

    private String token;
    private String email;
    private Long projectId;
}
