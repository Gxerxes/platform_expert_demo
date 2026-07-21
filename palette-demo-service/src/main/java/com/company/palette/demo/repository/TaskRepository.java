package com.company.palette.demo.repository;

import com.company.palette.demo.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Task repository — demonstrates Spring Data JPA query methods.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    List<Task> findByStatusOrderByCreatedAtDesc(Task.TaskStatus status);

    List<Task> findByAssigneeOrderByCreatedAtDesc(String assignee);

    List<Task> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Task t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assignee IS NULL OR t.assignee = :assignee)")
    List<Task> findByFilters(
        @Param("status") Task.TaskStatus status,
        @Param("priority") Task.TaskPriority priority,
        @Param("assignee") String assignee
    );
}
