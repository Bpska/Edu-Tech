import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, X, BookOpen, Eye, EyeOff, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AdminResourcesModal from './AdminResourcesModal';

const EMPTY = { title: '', description: '', price: '', isPublished: false };

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [resourcesCourse, setResourcesCourse] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
      toast.error('Failed to load courses from database.');
      setCourses([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = c  => { setEditing(c); setForm({ title: c.title, description: c.description, price: c.price, isPublished: c.isPublished }); setModal(true); };
  const closeModal = ()  => { setModal(false); setEditing(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description are required');
    setSaving(true);
    try {
      if (editing) { await api.put(`/admin/courses/${editing.id}`, form); toast.success('Course updated!'); }
      else          { await api.post('/admin/courses', form);              toast.success('Course created!'); }
      closeModal(); load();
    } catch { toast.error('Failed to save course'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this course and all associated tests & questions?')) return;
    try { await api.delete(`/admin/courses/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete course'); }
  };

  return (
    <AdminLayout title="Courses" subtitle="Create and manage learning courses">

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div /> {/* push button right */}
        <button className="adm-btn-primary" onClick={openCreate}>
          <Plus style={{ width: 16, height: 16 }} /> New Course
        </button>
      </div>

      {/* Course Cards */}
      {loading ? (
        <div className="adm-empty">Loading courses…</div>
      ) : (
        <div className="adm-courses-grid">
          {courses.map(c => (
            <div key={c.id} className="adm-course-card">
              {/* Top row: icon + title + actions */}
              <div className="adm-course-card-top">
                <div className="adm-course-card-info">
                  <div className="adm-course-icon">
                    <BookOpen style={{ width: 18, height: 18, color: '#E36A6A' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="adm-course-name">{c.title}</p>
                    <p className="adm-course-desc">{c.description}</p>
                  </div>
                </div>
                <div className="adm-course-actions">
                  <button className="adm-btn-icon" style={{ color: '#E36A6A' }} onClick={() => setResourcesCourse(c)} title="Resources"> <FileText style={{ width: 14, height: 14 }} /></button>
                  <button className="adm-btn-icon adm-btn-edit"   onClick={() => openEdit(c)}    title="Edit">   <Pencil  style={{ width: 14, height: 14 }} /></button>
                  <button className="adm-btn-icon adm-btn-delete" onClick={() => handleDelete(c.id)} title="Delete"> <Trash2  style={{ width: 14, height: 14 }} /></button>
                </div>
              </div>

              {/* Badge row */}
              <div className="adm-course-badges">
                <span className={`adm-badge ${c.price === 0 ? 'adm-badge-green' : 'adm-badge-yellow'}`}>
                  {c.price === 0 ? 'Free' : `₹${c.price}`}
                </span>
                <span className={`adm-badge ${c.isPublished ? 'adm-badge-teal' : 'adm-badge-gray'}`}>
                  {c.isPublished ? '✓ Published' : '◷ Draft'}
                </span>
                <span className="adm-section-tag">
                  {c._count?.tests ?? 0} Tests · {c._count?.purchases ?? 0} Students
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div className="adm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
            <motion.div
              className="adm-modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="adm-modal-header">
                <h3 className="adm-modal-title">{editing ? 'Edit Course' : 'New Course'}</h3>
                <button className="adm-modal-close" onClick={closeModal}><X style={{ width: 15, height: 15 }} /></button>
              </div>

              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Course Title *</label>
                  <input className="adm-input" placeholder="e.g. React Mastery Series" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Description *</label>
                  <textarea className="adm-input adm-textarea" placeholder="Brief course overview…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="adm-form-row">
                  <div className="adm-field">
                    <label className="adm-label">Price (₹)</label>
                    <input className="adm-input" type="number" min="0" placeholder="0 for free" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Status</label>
                    <button
                      className={`adm-toggle-btn ${form.isPublished ? 'on' : 'off'}`}
                      onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}
                    >
                      {form.isPublished ? <Eye style={{ width: 15, height: 15 }} /> : <EyeOff style={{ width: 15, height: 15 }} />}
                      {form.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </div>
                </div>
                <button className="adm-submit-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resources Modal */}
      <AnimatePresence>
        {resourcesCourse && (
          <AdminResourcesModal course={resourcesCourse} onClose={() => setResourcesCourse(null)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminCourses;
