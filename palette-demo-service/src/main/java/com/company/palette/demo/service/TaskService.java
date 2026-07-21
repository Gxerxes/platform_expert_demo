package com.company.palette.demo.service;

import com.company.palette.demo.dto.CreateTaskRequest;
import com.company.palette.demo.dto.TaskResponse;
import com.company.palette.demo.dto.UpdateTaskRequest;
import com.company.palette.demo.entity.Task;
import com.company.palette.demo.exception.ResourceNotFoundException;
import com.company.palette.demo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Task service — business logic layer.
 *
 * Demonstrates:
 * - CRUD operations with proper DTO mapping
 * - Partial update pattern
 * - Filter/query support
 * - Standard exception handling
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    /**
     * Create a new task.
     */
    public TaskResponse createTask(CreateTaskRequest request, String createdBy) {
        Task task = Task.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .priority(parsePriority(request.getPriority()))
            .assignee(request.getAssignee())
            .dueDate(request.getDueDate())
            .createdBy(createdBy)
            .build();

        task = taskRepository.save(task);
        log.info("Task created: id={}, title={}", task.getId(), task.getTitle());
        return toResponse(task);
    }

    /**
     * Get a task by ID.
     */
    @Transactional(readOnly = true)
    public TaskResponse getTask(String id) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task", id));
        return toResponse(task);
    }

    /**
     * List all tasks, optionally filtered.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(String status, String priority, String assignee) {
        List<Task> tasks;

        if (status != null || priority != null || assignee != null) {
            Task.TaskStatus statusEnum = status != null ? Task.TaskStatus.valueOf(status) : null;
            Task.TaskPriority priorityEnum = priority != null ? Task.TaskPriority.valueOf(priority) : null;
            tasks = taskRepository.findByFilters(statusEnum, priorityEnum, assignee);
        } else {
            tasks = taskRepository.findAllByOrderByCreatedAtDesc();
        }

        return tasks.stream().map(this::toResponse).toList();
    }

    /**
     * Update a task (partial update — only non-null fields).
     */
    public TaskResponse updateTask(String id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task", id));

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(Task.TaskStatus.valueOf(request.getStatus()));
        }
        if (request.getPriority() != null) {
            task.setPriority(parsePriority(request.getPriority()));
        }
        if (request.getAssignee() != null) {
            task.setAssignee(request.getAssignee());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }

        task = taskRepository.save(task);
        log.info("Task updated: id={}", task.getId());
        return toResponse(task);
    }

    /**
     * Delete a task.
     */
    public void deleteTask(String id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task", id);
        }
        taskRepository.deleteById(id);
        log.info("Task deleted: id={}", id);
    }

    // ─── Mapping helpers ────────────────────────────────────────

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus().name())
            .priority(task.getPriority().name())
            .assignee(task.getAssignee())
            .dueDate(task.getDueDate())
            .createdBy(task.getCreatedBy())
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .build();
    }

    private Task.TaskPriority parsePriority(String value) {
        if (value == null) return Task.TaskPriority.MEDIUM;
        return Task.TaskPriority.valueOf(value);
    }
}
