package com.company.palette.demo.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Task update request DTO — all fields optional (partial update).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskRequest {

    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    private String status;     // TODO, IN_PROGRESS, DONE, CANCELLED

    private String priority;   // LOW, MEDIUM, HIGH, CRITICAL

    private String assignee;

    private LocalDateTime dueDate;
}
