package com.beanstack.project_management_system.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Entity 
@NoArgsConstructor 
@AllArgsConstructor 
public class Project {
    @Id 
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String name;
    private String description;
    private String category;

    private List<String> tags = new ArrayList<>();

    @JsonIgnore 
    @OneToOne (mappedBy = "project", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private Chat chat;

    @ManyToOne 
    private User owner;

    @OneToMany (mappedBy = "project", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private List<Issue> issues = new ArrayList<>();

    @ManyToMany 
    private List<User> team = new ArrayList<>();

}