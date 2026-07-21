import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@palette/layout';
import { createTask } from '../api/taskApi';
import type { TaskPriority } from '../api/taskApi';

/**
 * Task Create Page — demonstrates form handling and data submission.
 *
 * Key patterns:
 * - Controlled form inputs
 * - Client-side validation
 * - API submission through BFF gateway
 * - Navigation after success
 */
export default function TaskCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    assignee: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.title.length > 200) errs.title = 'Title must be less than 200 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const task = await createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        assignee: form.assignee.trim() || undefined,
        dueDate: form.dueDate || undefined,
      });
      navigate(`/tasks/${task.id}`);
    } catch {
      alert('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Create New Task">
      <div style={containerStyle}>
        <button style={backBtnStyle} onClick={() => navigate('/tasks')}>← Back to List</button>

        <form style={cardStyle} onSubmit={handleSubmit}>
          <label style={labelStyle}>Title *</label>
          <input
            style={{ ...inputStyle, borderColor: errors.title ? '#dc3545' : '#dee2e6' }}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter task title"
          />
          {errors.title && <span style={errorStyle}>{errors.title}</span>}

          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Enter task description"
          />

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <label style={labelStyle}>Assignee</label>
          <input
            style={inputStyle}
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            placeholder="Enter assignee name"
          />

          <div style={btnGroupStyle}>
            <button type="submit" style={submitBtnStyle} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
            <button type="button" style={cancelBtnStyle} onClick={() => navigate('/tasks')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────

const containerStyle: React.CSSProperties = { maxWidth: 600 };
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 };
const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#495057', marginBottom: 4, marginTop: 12 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #dee2e6', fontSize: 14, boxSizing: 'border-box' as const };
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const errorStyle: React.CSSProperties = { color: '#dc3545', fontSize: 12, marginTop: 2 };
const btnGroupStyle: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 24 };
const submitBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
