import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

const OPT_LETTERS = ['A', 'B', 'C', 'D'];
const EMP_TEST = { courseId: '', title: '', duration: '' };
const EMP_Q = { text: '', options: ['', '', '', ''], correctAnswerIndex: 0 };

const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [questions, setQuestions] = useState({});

  // Modals
  const [testModal, setTestModal] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [testForm, setTestForm] = useState(EMP_TEST);
  const [savingTest, setSavingTest] = useState(false);

  const [qModal, setQModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [qTestId, setQTestId] = useState(null);
  const [qForm, setQForm] = useState(EMP_Q);
  const [savingQ, setSavingQ] = useState(false);

  const load = async () => {
    try {
      const [tRes, cRes] = await Promise.all([api.get('/admin/tests'), api.get('/admin/courses')]);
      setTests(tRes.data); setCourses(cRes.data);
    } catch (err) {
      console.error('Failed to load tests:', err);
      toast.error('Failed to load tests');
      setTests([]); setCourses([]);
    } finally { setLoading(false); }
  };

  const loadQ = async id => {
    try { 
      const res = await api.get(`/admin/tests/${id}/questions`); 
      setQuestions(q => ({ ...q, [id]: res.data })); 
    } catch (err) {
      console.error('Failed to load questions:', err);
      toast.error('Failed to load questions');
      setQuestions(q => ({ ...q, [id]: [] }));
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async id => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!questions[id]) await loadQ(id);
  };

  // Test Actions
  const handleSaveTest = async () => {
    if (!testForm.courseId || !testForm.title || !testForm.duration) return toast.error('All fields required');
    setSavingTest(true);
    try {
      if (editTest) { await api.put(`/admin/tests/${editTest.id}`, testForm); toast.success('Updated'); }
      else { await api.post('/admin/tests', testForm); toast.success('Created'); }
      setTestModal(false); load();
    } catch { toast.error('Failed'); }
    finally { setSavingTest(false); }
  };

  const handleDeleteTest = async id => {
    if (!confirm('Delete test and all questions?')) return;
    try { await api.delete(`/admin/tests/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  // Q Actions
  const handleSaveQ = async () => {
    if (!qForm.text || qForm.options.some(o => !o)) return toast.error('Fill all options');
    setSavingQ(true);
    try {
      if (editQ) { await api.put(`/admin/questions/${editQ.id}`, qForm); toast.success('Updated'); }
      else { await api.post('/admin/questions', { ...qForm, testId: qTestId }); toast.success('Added'); }
      setQModal(false); loadQ(qTestId); load();
    } catch { toast.error('Failed'); }
    finally { setSavingQ(false); }
  };

  const handleDeleteQ = async q => {
    if (!confirm('Delete question?')) return;
    try { await api.delete(`/admin/questions/${q.id}`); toast.success('Deleted'); loadQ(q.testId); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <AdminLayout title="Tests & Questions" subtitle="Manage mock test series">
      <div className="adm-toolbar">
        <div />
        <button className="adm-btn-primary" onClick={() => { setEditTest(null); setTestForm(EMP_TEST); setTestModal(true); }}>
          <Plus style={{ width: 16, height: 16 }} /> New Test
        </button>
      </div>

      {loading ? <div className="adm-empty">Loading tests…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tests.map(t => (
            <div key={t.id} className="adm-test-row">
              <div className="adm-test-row-header">
                <div className="adm-test-row-info">
                  <p className="adm-test-row-title">{t.title}</p>
                  <div className="adm-test-row-meta">
                    <span className="adm-section-tag">{t.course?.title}</span>
                    <span>⏱ {t.duration} min</span>
                    <span>{t._count?.questions ?? 0} Questions</span>
                    <span>{t._count?.examHistories ?? 0} Attempts</span>
                  </div>
                </div>
                <div className="adm-test-row-actions">
                  <button className="adm-btn-add" onClick={() => { setEditQ(null); setQTestId(t.id); setQForm(EMP_Q); setQModal(true); }}>
                    <Plus style={{ width: 13, height: 13 }} /> Add Q
                  </button>
                  <button className="adm-btn-icon adm-btn-edit" onClick={() => { setEditTest(t); setTestForm({ courseId: t.courseId, title: t.title, duration: t.duration }); setTestModal(true); }}><Pencil style={{ width: 14, height: 14 }} /></button>
                  <button className="adm-btn-icon adm-btn-delete" onClick={() => handleDeleteTest(t.id)}><Trash2 style={{ width: 14, height: 14 }} /></button>
                  <button className="adm-btn-expand" onClick={() => toggle(t.id)}>
                    {expanded === t.id ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === t.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    <div className="adm-questions-panel">
                      {!questions[t.id] ? <p className="adm-empty" style={{ padding: 16 }}>Loading…</p> :
                        questions[t.id].length === 0 ? <p className="adm-empty" style={{ padding: 16 }}>No questions yet.</p> :
                          questions[t.id].map((q, idx) => {
                            let opts = [];
                            try {
                              const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                              opts = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
                              if (!Array.isArray(opts)) opts = [];
                            } catch (e) {
                              opts = [];
                            }
                            return (
                              <div key={q.id} className="adm-question-item">
                                <div style={{ flex: 1 }}>
                                  <p className="adm-question-text">Q{idx + 1}. {q.text}</p>
                                  <div className="adm-question-options">
                                    {opts.map((o, i) => (
                                      <span key={i} className={`adm-q-option ${i === q.correctAnswerIndex ? 'correct' : ''}`}>
                                        {OPT_LETTERS[i]}: {o}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="adm-question-actions">
                                  <button className="adm-btn-icon adm-btn-edit" onClick={() => { setEditQ(q); setQTestId(t.id); setQForm({ text: q.text, options: opts, correctAnswerIndex: q.correctAnswerIndex }); setQModal(true); }}><Pencil style={{ width: 13, height: 13 }} /></button>
                                  <button className="adm-btn-icon adm-btn-delete" onClick={() => handleDeleteQ(q)}><Trash2 style={{ width: 13, height: 13 }} /></button>
                                </div>
                              </div>
                            );
                          })
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Test Modal */}
      <AnimatePresence>
        {testModal && (
          <motion.div className="adm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTestModal(false)}>
            <motion.div className="adm-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3 className="adm-modal-title">{editTest ? 'Edit Test' : 'New Test'}</h3>
                <button className="adm-modal-close" onClick={() => setTestModal(false)}><X style={{ width: 15, height: 15 }} /></button>
              </div>
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Course</label>
                  <select className="adm-input adm-select" value={testForm.courseId} onChange={e => setTestForm(f => ({ ...f, courseId: e.target.value }))}>
                    <option value="">Select course…</option>
                    {courses.map(c => <option key={c.id} value={c.id} style={{ background: '#FFFBF1' }}>{c.title}</option>)}
                  </select>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Test Title</label>
                  <input className="adm-input" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Duration (min)</label>
                  <input className="adm-input" type="number" value={testForm.duration} onChange={e => setTestForm(f => ({ ...f, duration: e.target.value }))} />
                </div>
                <button className="adm-submit-btn" onClick={handleSaveTest} disabled={savingTest}>{savingTest ? 'Saving…' : 'Save Test'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Q Modal */}
      <AnimatePresence>
        {qModal && (
          <motion.div className="adm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQModal(false)}>
            <motion.div className="adm-modal adm-modal-wide" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3 className="adm-modal-title">{editQ ? 'Edit Question' : 'Add Question'}</h3>
                <button className="adm-modal-close" onClick={() => setQModal(false)}><X style={{ width: 15, height: 15 }} /></button>
              </div>
              <div className="adm-form">
                <div className="adm-field">
                  <label className="adm-label">Question Text</label>
                  <textarea className="adm-input adm-textarea" value={qForm.text} onChange={e => setQForm(f => ({ ...f, text: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Options (A/B/C/D)</label>
                  {qForm.options.map((opt, idx) => (
                    <div key={idx} className="adm-option-row">
                      <button className={`adm-option-letter ${qForm.correctAnswerIndex === idx ? 'correct' : 'incorrect'}`} onClick={() => setQForm(f => ({ ...f, correctAnswerIndex: idx }))}>{OPT_LETTERS[idx]}</button>
                      <input className="adm-input" value={opt} onChange={e => { const o = [...qForm.options]; o[idx] = e.target.value; setQForm(f => ({ ...f, options: o })); }} placeholder={`Option ${OPT_LETTERS[idx]}`} />
                    </div>
                  ))}
                  <p className="adm-option-hint">Click a letter button to mark the correct answer.</p>
                </div>
                <button className="adm-submit-btn" onClick={handleSaveQ} disabled={savingQ}>{savingQ ? 'Saving…' : 'Save Question'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminTests;
