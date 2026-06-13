import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Pencil, Video, FileText, Link as LinkIcon } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EMP_RES = { title: '', type: 'VIDEO', url: '', content: '' };

const AdminResourcesModal = ({ course, onClose }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMP_RES);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    try {
      const res = await api.get(`/admin/courses/${course.id}/resources`);
      setResources(res.data);
    } catch (err) {
      console.error('Failed to load resources:', err);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [course.id]);

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/resources/${editing.id}`, form);
        toast.success('Resource updated');
      } else {
        await api.post('/admin/resources', { ...form, courseId: course.id });
        toast.success('Resource added');
      }
      setShowForm(false);
      loadResources();
    } catch {
      toast.error('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await api.delete(`/admin/resources/${id}`);
      toast.success('Resource deleted');
      loadResources();
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  return (
    <motion.div className="adm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="adm-modal adm-modal-wide" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h3 className="adm-modal-title">Resources for: {course.title}</h3>
          <button className="adm-modal-close" onClick={onClose}><X style={{ width: 15, height: 15 }} /></button>
        </div>

        <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {!showForm && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="adm-btn-primary" onClick={() => { setForm(EMP_RES); setEditing(null); setShowForm(true); }}>
                <Plus style={{ width: 16, height: 16 }} /> Add Resource
              </button>
            </div>
          )}

          {showForm ? (
            <div className="adm-form" style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#E36A6A' }}>{editing ? 'Edit Resource' : 'New Resource'}</h4>
              <div className="adm-field">
                <label className="adm-label">Title *</label>
                <input className="adm-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction Video" />
              </div>
              <div className="adm-form-row">
                <div className="adm-field">
                  <label className="adm-label">Type</label>
                  <select className="adm-input adm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="VIDEO" style={{ background: '#FFFBF1' }}>Video URL</option>
                    <option value="DOCUMENT" style={{ background: '#FFFBF1' }}>Document / Link</option>
                    <option value="TEXT" style={{ background: '#FFFBF1' }}>Rich Text</option>
                  </select>
                </div>
              </div>

              {form.type !== 'TEXT' && (
                <div className="adm-field">
                  <label className="adm-label">{form.type === 'VIDEO' ? 'Video URL (YouTube/Vimeo)' : 'Document URL'}</label>
                  <input className="adm-input" value={form.url || ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
              )}

              {form.type === 'TEXT' && (
                <div className="adm-field">
                  <label className="adm-label">Text Content</label>
                  <textarea className="adm-input adm-textarea" value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your content here..." style={{ minHeight: '150px' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="adm-submit-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="adm-submit-btn" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#555' }} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              {loading ? (
                <p className="adm-empty">Loading resources...</p>
              ) : resources.length === 0 ? (
                <p className="adm-empty">No resources added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resources.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {r.type === 'VIDEO' ? <Video size={18} color="#E36A6A" /> : r.type === 'TEXT' ? <FileText size={18} color="#E36A6A" /> : <LinkIcon size={18} color="#E36A6A" />}
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#333' }}>{r.title}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{r.type} {r.url ? `· ${r.url}` : ''}</p>
                        </div>
                      </div>
                      <div className="adm-course-actions">
                        <button className="adm-btn-icon adm-btn-edit" onClick={() => { setForm({ title: r.title, type: r.type, url: r.url, content: r.content }); setEditing(r); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="adm-btn-icon adm-btn-delete" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminResourcesModal;
