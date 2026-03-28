import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UserPlus, Upload, Users, RefreshCw, Edit, Trash2, X, Check, GraduationCap, School } from 'lucide-react';
import AnimatedSection from './components/AnimatedSection';

const AdminPanel = ({ readOnly = false }) => {
  const [activeTab, setActiveTab] = useState('students');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [status, setStatus] = useState('');

  const [students, setStudents] = useState([]);
  const [rollNo, setRollNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const [teachers, setTeachers] = useState([]);
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [assignedClasses, setAssignedClasses] = useState('');

  useEffect(() => { fetchStudents(); fetchTeachers(); }, []);

  const fetchStudents = async () => {
    try { const r = await axios.get('http://localhost:8080/api/manage/students'); setStudents(r.data); } catch (e) { console.error(e); }
  };
  const fetchTeachers = async () => {
    try { const r = await axios.get('http://localhost:8080/api/manage/teachers'); setTeachers(r.data); } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setEditMode(false); setCurrentId(null); setStatus('');
    setRollNo(''); setFirstName(''); setLastName(''); setEmail(''); setClassName(''); setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStudentUsername(''); setStudentPassword('');
    setTeacherUsername(''); setTeacherPassword(''); setTeacherSubject(''); setAssignedClasses('');
  };

  const handleStudentEdit = (s) => { setEditMode(true); setCurrentId(s.id); setRollNo(s.rollNumber); setFirstName(s.firstName); setLastName(s.lastName || ''); setEmail(s.email || ''); setClassName(s.className || ''); setStudentUsername(''); setStudentPassword(''); setStatus(''); window.scrollTo(0, 0); };
  const handleStudentDelete = async (id, name) => {
    if (window.confirm(`Delete student ${name}?`)) { try { await axios.delete(`http://localhost:8080/api/manage/delete-student/${id}`); setStudents(students.filter(s => s.id !== id)); setStatus(`Deleted ${name}.`); } catch (err) { setStatus('Error: ' + err.message); } }
  };
  const handleStudentSubmit = async (e) => {
    e.preventDefault(); setStatus('Processing...');
    try {
      if (editMode) {
        await axios.put(`http://localhost:8080/api/manage/update-student/${currentId}`, { rollNumber: rollNo, firstName, lastName, email, className });
        setStatus(`Updated ${firstName}.`);
      } else {
        const res = await axios.post('http://localhost:8080/api/manage/add-student', { rollNumber: rollNo, firstName, lastName, email, className, faceEncodingId: `face_${rollNo}`, username: studentUsername, password: studentPassword });
        if (file) { const fd = new FormData(); fd.append('file', file); await axios.post(`http://localhost:8080/api/manage/upload-photo/${res.data.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
        setStatus(`Added ${firstName}.`);
      }
      resetForm(); fetchStudents();
    } catch (err) { setStatus('Error: ' + (err.response?.data?.message || err.message)); }
  };

  const handleTeacherEdit = (t) => { setEditMode(true); setCurrentId(t.id); setTeacherUsername(t.username); setTeacherSubject(t.subject || ''); setAssignedClasses(t.assignedClasses || ''); setTeacherPassword(''); setStatus(''); window.scrollTo(0, 0); };
  const handleTeacherDelete = async (id, name) => {
    if (window.confirm(`Delete teacher ${name}?`)) { try { await axios.delete(`http://localhost:8080/api/manage/delete-teacher/${id}`); setTeachers(teachers.filter(t => t.id !== id)); setStatus(`Deleted ${name}.`); } catch (err) { setStatus('Error: ' + err.message); } }
  };
  const handleTeacherSubmit = async (e) => {
    e.preventDefault(); setStatus('Processing...');
    try {
      const payload = { username: teacherUsername, password: teacherPassword, subject: teacherSubject, assignedClasses };
      if (editMode) { await axios.put(`http://localhost:8080/api/manage/update-teacher/${currentId}`, payload); setStatus(`Updated ${teacherUsername}.`); }
      else { if (!teacherPassword) { setStatus('Password required for new teachers'); return; } await axios.post('http://localhost:8080/api/manage/add-teacher', payload); setStatus(`Registered ${teacherUsername}.`); }
      resetForm(); fetchTeachers();
    } catch (err) { setStatus('Error: ' + (err.response?.data?.message || err.message)); }
  };

  const darkInputClass = 'dark-input w-full px-4 py-2.5 rounded-xl text-sm';

  const tabs = [
    { id: 'students', label: 'Manage Students', Icon: GraduationCap, color: '#6366f1' },
    { id: 'teachers', label: 'Manage Teachers', Icon: School, color: '#22d3ee' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="relative overflow-hidden py-8 px-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,238,0.04))' }}>
        <div className="max-w-6xl mx-auto">
          <AnimatedSection variant="fadeLeft">
            <h1 className="text-3xl font-bold font-display text-white">Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Manage students and teachers</p>
          </AnimatedSection>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Tabs */}
        <AnimatedSection variant="fade">
          <div className="flex space-x-2 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {tabs.map(({ id, label, Icon, color }) => (
              <button key={id}
                onClick={() => { setActiveTab(id); resetForm(); }}
                className="relative flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: activeTab === id ? 'white' : 'var(--color-text-muted)' }}
              >
                {activeTab === id && (
                  <motion.div layoutId="admin-tab"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2" style={{ color: activeTab === id ? color : 'var(--color-text-muted)' }}>
                  <Icon size={16} />{label}
                </span>
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Status */}
        {status && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl text-center text-sm font-medium"
            style={status.includes('Error') ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' } : { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
            {status}
          </motion.div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {!readOnly && (
              <AnimatedSection variant="fadeUp">
                <div className="glass rounded-2xl p-6" style={{ border: editMode ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(99,102,241,0.2)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                      {editMode ? <Edit size={20} style={{ color: '#fbbf24' }} /> : <UserPlus size={20} style={{ color: '#6366f1' }} />}
                      {editMode ? 'Edit Student' : 'Register Student'}
                    </h2>
                    {editMode && <button onClick={resetForm} className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}><X size={15} /> Cancel</button>}
                  </div>
                  <form onSubmit={handleStudentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { placeholder: 'Roll Number', value: rollNo, setter: setRollNo, required: true },
                      { placeholder: 'First Name', value: firstName, setter: setFirstName, required: true },
                      { placeholder: 'Last Name', value: lastName, setter: setLastName },
                      { placeholder: 'Email', value: email, setter: setEmail, type: 'email' },
                      { placeholder: 'Class Name (e.g. CSA)', value: className, setter: setClassName },
                    ].map(({ placeholder, value, setter, required, type = 'text' }) => (
                      <input key={placeholder} type={type} placeholder={placeholder} value={value} onChange={e => setter(e.target.value)} required={required} className={darkInputClass} />
                    ))}
                    {!editMode && (
                      <>
                        <input className={darkInputClass} placeholder="Username (default: Roll No)" value={studentUsername} onChange={e => setStudentUsername(e.target.value)} />
                        <input className={darkInputClass} placeholder="Password" type="password" value={studentPassword} onChange={e => setStudentPassword(e.target.value)} />
                        <div className="flex items-center gap-2 p-3 rounded-xl md:col-span-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Upload size={14} style={{ color: 'var(--color-text-muted)' }} />
                          <input type="file" ref={fileInputRef} className="text-sm" onChange={e => setFile(e.target.files[0])} accept="image/*"
                            style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      </>
                    )}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="md:col-span-2 py-3 rounded-xl text-white font-semibold flex justify-center items-center gap-2"
                      style={{ background: editMode ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: editMode ? '0 4px 20px rgba(245,158,11,0.3)' : '0 4px 20px rgba(99,102,241,0.3)' }}>
                      {editMode ? <><Check size={16} /> Update Student</> : <><UserPlus size={16} /> Register Student</>}
                    </motion.button>
                  </form>
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection variant="fadeUp" delay={0.1}>
              <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.05)' }}>
                  <h3 className="font-bold font-display text-white flex items-center gap-2">
                    <Users size={18} style={{ color: '#6366f1' }} /> Students ({students.length})
                  </h3>
                  <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }} onClick={fetchStudents} style={{ color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={18} />
                  </motion.button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <tr>
                        {['Roll No', 'Name', 'Class', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => (
                        <motion.tr key={s.id}
                          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                          transition={{ delay: idx * 0.03 }}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#818cf8' }}>{s.rollNumber}</td>
                          <td className="px-5 py-3.5 text-sm text-white">{s.firstName} {s.lastName}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{s.className || '-'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleStudentEdit(s)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}><Edit size={14} /></button>
                              <button onClick={() => handleStudentDelete(s.id, s.firstName)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimatedSection>
          </div>
        )}

        {/* TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            {!readOnly && (
              <AnimatedSection variant="fadeUp">
                <div className="glass rounded-2xl p-6" style={{ border: editMode ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(34,211,238,0.2)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                      {editMode ? <Edit size={20} style={{ color: '#fbbf24' }} /> : <UserPlus size={20} style={{ color: '#22d3ee' }} />}
                      {editMode ? 'Edit Teacher' : 'Register Teacher'}
                    </h2>
                    {editMode && <button onClick={resetForm} className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}><X size={15} /> Cancel</button>}
                  </div>
                  <form onSubmit={handleTeacherSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Username</label>
                      <input className={darkInputClass} value={teacherUsername} onChange={e => setTeacherUsername(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Password {editMode && '(blank = keep current)'}</label>
                      <input className={darkInputClass} type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} required={!editMode} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Subject</label>
                      <input className={darkInputClass} value={teacherSubject} onChange={e => setTeacherSubject(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Assigned Classes (e.g. CSA, CSB)</label>
                      <input className={darkInputClass} value={assignedClasses} onChange={e => setAssignedClasses(e.target.value)} placeholder="CSA, CSB" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="md:col-span-2 py-3 rounded-xl text-white font-semibold flex justify-center items-center gap-2"
                      style={{ background: editMode ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #0891b2, #22d3ee)', boxShadow: editMode ? '0 4px 20px rgba(245,158,11,0.3)' : '0 4px 20px rgba(34,211,238,0.25)' }}>
                      {editMode ? <><Check size={16} /> Update Teacher</> : <><UserPlus size={16} /> Register Teacher</>}
                    </motion.button>
                  </form>
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection variant="fadeUp" delay={0.1}>
              <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(34,211,238,0.15)' }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(34,211,238,0.03)' }}>
                  <h3 className="font-bold font-display text-white flex items-center gap-2">
                    <Users size={18} style={{ color: '#22d3ee' }} /> Teachers ({teachers.length})
                  </h3>
                  <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }} onClick={fetchTeachers} style={{ color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={18} />
                  </motion.button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <tr>
                        {['Username', 'Subject', 'Assigned Classes', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t, idx) => (
                        <motion.tr key={t.id}
                          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                          transition={{ delay: idx * 0.03 }}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#22d3ee' }}>{t.username}</td>
                          <td className="px-5 py-3.5 text-sm text-white">{t.subject || '-'}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-1 flex-wrap">
                              {t.assignedClasses
                                ? t.assignedClasses.split(',').map(c => (
                                  <span key={c} className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{c.trim()}</span>
                                ))
                                : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>All</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleTeacherEdit(t)} className="p-1.5 rounded-lg" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}><Edit size={14} /></button>
                              <button onClick={() => handleTeacherDelete(t.id, t.username)} className="p-1.5 rounded-lg" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimatedSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
