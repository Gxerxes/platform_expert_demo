package com.company.palette.demo.controller;

import com.company.palette.demo.dto.CreateTaskRequest;
import com.company.palette.demo.dto.TaskResponse;
import com.company.palette.demo.dto.UpdateTaskRequest;
import com.company.palette.demo.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Task REST Controller — demonstrates standard CRUD API design.
 *
 * API Design:
 * - Base path: /api/v1/tasks
 * - All responses wrapped in standard { "data": ... } envelope
 * - Supports filtering via query parameters
 * - Uses standard HTTP methods and status codes
 *
 * When deployed behind Palette BFF, these APIs are accessed via:
 *   GET  /palette/api/v1/backend/demo/tasks
 *   POST /palette/api/v1/backend/demo/tasks
 *   etc.
 *
 * The BFF gateway handles authentication and token relay.
 */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * Create a new task.
     * POST /api/v1/tasks
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @RequestHeader(value = "X-User-ID", required = false) String userId) {
        TaskResponse task = taskService.createTask(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("data", task));
    }

    /**
     * Get a task by ID.
     * GET /api/v1/tasks/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTask(@PathVariable String id) {
        TaskResponse task = taskService.getTask(id);
        return ResponseEntity.ok(Map.of("data", task));
    }

    /**
     * List tasks with optional filters.
     * GET /api/v1/tasks?status=TODO&priority=HIGH&assignee=john
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String assignee) {
        List<TaskResponse> tasks = taskService.listTasks(status, priority, assignee);
        return ResponseEntity.ok(Map.of("data", tasks));
    }

    /**
     * Update a task (partial update).
     * PUT /api/v1/tasks/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(
            @PathVariable String id,
            @Valid @RequestBody UpdateTaskRequest request) {
        TaskResponse task = taskService.updateTask(id, request);
        return ResponseEntity.ok(Map.of("data", task));
    }

    /**
     * Delete a task.
     * DELETE /api/v1/tasks/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(Map.of("data", Map.of("success", true)));
    }
}
