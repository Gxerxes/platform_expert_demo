package com.company.palette.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Task creation request DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    private String priority;   // LOW, MEDIUM, HIGH, CRITICAL

    private String assignee;

    private LocalDateTime dueDate;
}
