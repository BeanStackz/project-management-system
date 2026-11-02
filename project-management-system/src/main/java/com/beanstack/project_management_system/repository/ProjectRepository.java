package com.beanstack.project_management_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.beanstack.project_management_system.model.Project;
import com.beanstack.project_management_system.model.User;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findByOwner(User user);

    List<Project> findByNameContainingAndTeamContaining(String name, User user);

    @Query("SELECT p FROM Project p JOIN p.team t WHERE t = :user")
    List<Project> findProjectByTeam(@Param("user") User user);

    List<Project> findByTeamContainingOrOwner(User user, User owner);


}
