import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

const OPT_LETTERS = ['A', 'B', 'C', 'D'];
const EMP_TEST = { courseId: '', title: '', duration: '' };
const EMP_Q = { text: '', options: ['', '', '', ''], correctAnswerIndex: 0 };

// ── Bulk paste parser ──────────────────────────────────────────────────────────
// Supports formats:
//   Q1. Question text?        OR   1. Question text?
//   A) Option / A. Option     OR   a) Option
//   Answer: B                 OR   Ans: B   OR   Correct: B
const parseBulkText = (raw) => {
  const questions = [];
  // Split by blank lines or "Q\d+" markers
  const blocks = raw.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Question line — strip Q1. / 1. / Q1) prefix
    const qLine = lines[0].replace(/^[Qq]?\d+[\.\)]\s*/, '').trim();
    if (!qLine) continue;

    const options = [];
    let correctIdx = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Answer line
      const ansMatch = line.match(/^(?:answer|ans|correct)\s*[:\-]\s*([A-Da-d])/i);
      if (ansMatch) {
        correctIdx = 'ABCD'.indexOf(ansMatch[1].toUpperCase());
        continue;
      }
      // Option line: A) / A. / a) / (A)
      const optMatch = line.match(/^[\(\[]?([A-Da-d])[\)\]\.]\s*(.+)/);
      if (optMatch) {
        options.push(optMatch[2].trim());
      }
    }

    if (qLine && options.length >= 2) {
      // Pad to 4 options if needed
      while (options.length < 4) options.push('');
      questions.push({
        text: qLine,
        options: options.slice(0, 4),
        correctAnswerIndex: Math.max(0, Math.min(3, correctIdx)),
      });
    }
  }
  return questions;
};

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

  // Bulk import
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkTestId, setBulkTestId] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [parsed, setParsed] = useState(null); // null = not parsed yet
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const load = async () => {
    try {
      const [tRes, cRes] = await Promise.all([api.get('/admin/tests'), api.get('/admin/courses')]);
      setTests(tRes.data); setCourses(cRes.data);
    } catch (err) {
      toast.error('Failed to load tests');
      setTests([]); setCourses([]);
    } finally { setLoading(false); }
  };

  const loadQ = async id => {
    try {
      const res = await api.get(`/admin/tests/${id}/questions`);
      setQuestions(q => ({ ...q, [id]: res.data }));
    } catch {
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

  // Single Q Actions
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

  // Bulk Import Actions
  const handleParse = () => {
    const result = parseBulkText(bulkText);
    if (!result.length) return toast.error('Could not parse any questions. Check format.');
    setParsed(result);
    toast.success(`Parsed ${result.length} question${result.length > 1 ? 's' : ''} — review and save`);
  };

  const handleBulkSave = async () => {
    if (!parsed?.length) return;
    setBulkSaving(true);
    setBulkProgress(0);
    let saved = 0;
    for (const q of parsed) {
      try {
        await api.post('/admin/questions', { ...q, testId: bulkTestId });
        saved++;
        setBulkProgress(Math.round((saved / parsed.length) * 100));
      } catch { /* continue */ }
    }
    setBulkSaving(false);
    toast.success(`Saved ${saved}/${parsed.length} questions!`);
    setBulkModal(false);
    setBulkText('');
    setParsed(null);
    loadQ(bulkTestId);
    load();
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
                  <button
                    className="adm-btn-add"
                    style={{ background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}
                    onClick={() => { setBulkTestId(t.id); setBulkText(''); setParsed(null); setBulkModal(true); }}
                    title="Bulk import questions by pasting text"
                  >
                    <Upload style={{ width: 13, height: 13 }} /> Bulk Import
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
                            } catch { opts = []; }
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

      {/* ── Test Modal ── */}
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
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
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

      {/* ── Single Q Modal ── */}
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
                  <label className="adm-label">Options (A/B/C/D) — click letter to mark correct</label>
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

      {/* ── Bulk Import Modal ── */}
      <AnimatePresence>
        {bulkModal && (
          <motion.div className="adm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!bulkSaving) setBulkModal(false); }}>
            <motion.div className="adm-modal" style={{ maxWidth: '700px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <h3 className="adm-modal-title">📥 Bulk Question Import</h3>
                <button className="adm-modal-close" onClick={() => setBulkModal(false)}><X style={{ width: 15, height: 15 }} /></button>
              </div>

              {/* Format Guide */}
              <div style={{ background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paste Format</p>
                <pre style={{ margin: 0, fontSize: '12px', color: '#334155', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{`Q1. What is the capital of India?
A) Mumbai
B) New Delhi
C) Kolkata
D) Chennai
Answer: B

Q2. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury
D) Mars
Answer: C`}</pre>
              </div>

              <div className="adm-field">
                <label className="adm-label">Paste Your Questions Here</label>
                <textarea
                  className="adm-input adm-textarea"
                  style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '13px' }}
                  value={bulkText}
                  onChange={e => { setBulkText(e.target.value); setParsed(null); }}
                  placeholder="Paste your questions in the format shown above…"
                  disabled={bulkSaving}
                />
              </div>

              {/* Parse Button */}
              {!parsed && (
                <button
                  className="adm-submit-btn"
                  style={{ background: '#16A34A' }}
                  onClick={handleParse}
                  disabled={!bulkText.trim()}
                >
                  Parse & Preview Questions
                </button>
              )}

              {/* Preview */}
              {parsed && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CheckCircle style={{ width: 16, height: 16, color: '#16A34A' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#16A34A' }}>
                      {parsed.length} question{parsed.length > 1 ? 's' : ''} parsed — review below
                    </p>
                    <button onClick={() => setParsed(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '12px' }}>
                      ← Re-edit
                    </button>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {parsed.map((q, i) => (
                      <div key={i} style={{ background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
                        <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>Q{i + 1}. {q.text}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {q.options.map((o, idx) => (
                            <span key={idx} style={{
                              padding: '2px 10px', borderRadius: '20px', fontSize: '12px',
                              background: idx === q.correctAnswerIndex ? '#EFF6FF' : '#F1F5F9',
                              color: idx === q.correctAnswerIndex ? '#1D4ED8' : '#64748B',
                              border: `1px solid ${idx === q.correctAnswerIndex ? '#BFDBFE' : '#E2E8F0'}`,
                              fontWeight: idx === q.correctAnswerIndex ? 700 : 400,
                            }}>
                              {OPT_LETTERS[idx]}: {o || '—'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar (while saving) */}
                  {bulkSaving && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Saving questions…</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8' }}>{bulkProgress}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${bulkProgress}%`, height: '100%', background: '#1D4ED8', borderRadius: '99px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  <button
                    className="adm-submit-btn"
                    onClick={handleBulkSave}
                    disabled={bulkSaving}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {bulkSaving ? `Saving… ${bulkProgress}%` : `✅ Save All ${parsed.length} Questions`}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminTests;
