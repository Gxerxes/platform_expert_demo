package com.company.palette.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Task response DTO — returned by all task APIs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {

    private String id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private LocalDateTime dueDate;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
