import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@palette/layout';
import { Loading, ErrorState } from '@palette/ui';
import { fetchTasks, deleteTask } from '../api/taskApi';
import type { Task, TaskStatus, TaskPriority } from '../api/taskApi';

/**
 * Task List Page — demonstrates data fetching, filtering, and CRUD operations.
 *
 * Key patterns:
 * - Loading / Error / Data state management
 * - API calls through BFF gateway
 * - Navigation with React Router
 * - User confirmation for destructive actions
 */
export default function TaskListPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('Failed to delete task');
    }
  };

  if (loading) return <PageContainer title="Task Management"><Loading /></PageContainer>;
  if (error) return <PageContainer title="Task Management"><ErrorState message={error} onRetry={loadTasks} /></PageContainer>;

  return (
    <PageContainer title="Task Management">
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={filterStyle}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
            style={selectStyle}
          >
            <option value="">All Status</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
            style={selectStyle}
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <button style={createBtnStyle} onClick={() => navigate('/tasks/create')}>
          + New Task
        </button>
      </div>

      {/* Task Table */}
      {tasks.length === 0 ? (
        <div style={emptyStyle}>No tasks found. Create your first task!</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Priority</th>
              <th style={thStyle}>Assignee</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} style={trStyle}>
                <td style={tdStyle}>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/tasks/${task.id}`); }} style={linkStyle}>
                    {task.title}
                  </a>
                </td>
                <td style={tdStyle}><StatusBadge status={task.status} /></td>
                <td style={tdStyle}><PriorityBadge priority={task.priority} /></td>
                <td style={tdStyle}>{task.assignee || '-'}</td>
                <td style={tdStyle}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                <td style={tdStyle}>
                  <button style={actionBtnStyle} onClick={() => navigate(`/tasks/${task.id}`)}>View</button>
                  <button style={{ ...actionBtnStyle, color: '#dc3545' }} onClick={() => handleDelete(task.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageContainer>
  );
}

// ─── Sub-components ───────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<TaskStatus, string> = {
    TODO: '#6c757d',
    IN_PROGRESS: '#0d6efd',
    DONE: '#198754',
    CANCELLED: '#dc3545',
  };
  return (
    <span style={{ ...badgeStyle, backgroundColor: colors[status], color: '#fff' }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    LOW: '#e9ecef',
    MEDIUM: '#ffc107',
    HIGH: '#fd7e14',
    CRITICAL: '#dc3545',
  };
  return (
    <span style={{ ...badgeStyle, backgroundColor: colors[priority], color: priority === 'LOW' ? '#333' : '#fff' }}>
      {priority}
    </span>
  );
}

// ─── Styles ───────────────────────────────────────────────

const toolbarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 };
const filterStyle: React.CSSProperties = { display: 'flex', gap: 8 };
const selectStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: 4, border: '1px solid #dee2e6', fontSize: 14 };
const createBtnStyle: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#495057', borderBottom: '2px solid #dee2e6' };
const trStyle: React.CSSProperties = { borderBottom: '1px solid #eee' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: 14 };
const linkStyle: React.CSSProperties = { color: '#0d6efd', textDecoration: 'none', fontWeight: 500 };
const badgeStyle: React.CSSProperties = { padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 };
const actionBtnStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0d6efd', marginRight: 8 };
const emptyStyle: React.CSSProperties = { textAlign: 'center', padding: 40, color: '#6c757d', fontSize: 16 };
