import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@palette/layout';
import { Loading, ErrorState } from '@palette/ui';
import { fetchTask, updateTask } from '../api/taskApi';
import type { Task, TaskStatus, TaskPriority } from '../api/taskApi';

/**
 * Task Detail Page — demonstrates viewing and editing a single resource.
 *
 * Key patterns:
 * - Route parameter extraction (useParams)
 * - Data fetching on mount
 * - Inline editing with form state
 * - Status transitions
 */
export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: '' as TaskStatus, priority: '' as TaskPriority, assignee: '' });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await fetchTask(id);
        setTask(data);
        setForm({ title: data.title, description: data.description, status: data.status, priority: data.priority, assignee: data.assignee });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      const updated = await updateTask(id, {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        assignee: form.assignee,
      });
      setTask(updated);
      setEditing(false);
    } catch {
      alert('Failed to update task');
    }
  };

  if (loading) return <PageContainer title="Task Detail"><Loading /></PageContainer>;
  if (error || !task) return <PageContainer title="Task Detail"><ErrorState message={error ?? 'Not found'} onRetry={() => navigate('/tasks')} /></PageContainer>;

  return (
    <PageContainer title="Task Detail">
      <div style={containerStyle}>
        <button style={backBtnStyle} onClick={() => navigate('/tasks')}>← Back to List</button>

        <div style={cardStyle}>
          {editing ? (
            <>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <label style={labelStyle}>Assignee</label>
              <input style={inputStyle} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
              <div style={btnGroupStyle}>
                <button style={saveBtnStyle} onClick={handleSave}>Save</button>
                <button style={cancelBtnStyle} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <h2 style={titleStyle}>{task.title}</h2>
              <div style={metaStyle}>
                <span>Status: <strong>{task.status.replace('_', ' ')}</strong></span>
                <span>Priority: <strong>{task.priority}</strong></span>
                <span>Assignee: <strong>{task.assignee || 'Unassigned'}</strong></span>
              </div>
              <p style={descStyle}>{task.description || 'No description'}</p>
              <div style={footerStyle}>
                <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(task.updatedAt).toLocaleString()}</span>
              </div>
              <button style={editBtnStyle} onClick={() => setEditing(true)}>Edit Task</button>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────

const containerStyle: React.CSSProperties = { maxWidth: 720 };
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 };
const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const titleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 600, marginBottom: 12, color: '#1a1a2e' };
const metaStyle: React.CSSProperties = { display: 'flex', gap: 24, fontSize: 14, color: '#495057', marginBottom: 16 };
const descStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.6, color: '#333', marginBottom: 20 };
const footerStyle: React.CSSProperties = { display: 'flex', gap: 24, fontSize: 12, color: '#6c757d', marginBottom: 16, paddingTop: 16, borderTop: '1px solid #eee' };
const editBtnStyle: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#495057', marginBottom: 4, marginTop: 12 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #dee2e6', fontSize: 14, boxSizing: 'border-box' };
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const btnGroupStyle: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 20 };
const saveBtnStyle: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
const cancelBtnStyle: React.CSSProperties = { padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' };
