import { paletteApi } from '@palette/api';
import type { ApiResponse } from '@palette/api';

// ─── Types ──────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

// ─── API Calls ──────────────────────────────────────────

/**
 * All API calls go through Palette BFF gateway.
 * Path: /palette/api/v1/backend/demo/tasks
 *
 * BFF gateway will:
 * 1. Validate session cookie
 * 2. Attach Authorization: Bearer <access_token>
 * 3. Forward to demo-service at http://localhost:8081/api/v1/tasks
 */

const GATEWAY_BASE = '/backend/demo/tasks';

export async function fetchTasks(filter?: TaskFilter): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (filter?.status) params.status = filter.status;
  if (filter?.priority) params.priority = filter.priority;
  if (filter?.assignee) params.assignee = filter.assignee;

  const response = await paletteApi.get<ApiResponse<Task[]>>(GATEWAY_BASE, { params });
  return response.data.data;
}

export async function fetchTask(id: string): Promise<Task> {
  const response = await paletteApi.get<ApiResponse<Task>>(`${GATEWAY_BASE}/${id}`);
  return response.data.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await paletteApi.post<ApiResponse<Task>>(GATEWAY_BASE, payload);
  return response.data.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const response = await paletteApi.put<ApiResponse<Task>>(`${GATEWAY_BASE}/${id}`, payload);
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await paletteApi.delete(`${GATEWAY_BASE}/${id}`);
}
