import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Users, Activity, AlertTriangle, Download, Search, Filter, ClipboardList, CheckCircle, X } from 'lucide-react';
import AnimatedSection from './components/AnimatedSection';
import AnimatedCounter from './components/AnimatedCounter';
import TiltCard from './components/TiltCard';
import Carousel from './components/Carousel';
import FloatingOrbs from './components/FloatingOrbs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Dark chart theme
const chartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    tooltip: {
      backgroundColor: '#1a1a2e',
      borderColor: 'rgba(99,102,241,0.3)',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
    },
  },
  scales: {
    x: { ticks: { color: '#64748b', maxTicksLimit: 6 }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

const StatCard = ({ icon: Icon, label, value, suffix = '', color, glowColor }) => (
  <TiltCard
    className="glass rounded-2xl p-6 cursor-default"
    glowColor={glowColor}
    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-2xl font-bold text-white font-display">
          <AnimatedCounter target={typeof value === 'number' ? value : parseFloat(value) || 0} suffix={suffix} />
        </p>
      </div>
    </div>
  </TiltCard>
);

const Dashboard = ({ userRole, user }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [manualClassFilter, setManualClassFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState({});
  const [manualStatus, setManualStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = 'http://localhost:8080/api/attendance/session/1';
        if (userRole === 'TEACHER' && user?.subject) url += `?subject=${encodeURIComponent(user.subject)}`;
        const response = await axios.get(url);
        setAttendanceData(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (error) {
        setAttendanceData([]);
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    fetchStudents();
    return () => clearInterval(interval);
  }, [userRole, user?.subject]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/manage/students');
      setStudents(res.data);
    } catch (e) { console.error(e); }
  };

  const handleManualSubmit = async (status = 'PRESENT') => {
    setManualStatus('Submitting...');
    try {
      const selectedIds = Object.keys(selectedStudents).filter(id => selectedStudents[id]);
      if (selectedIds.length === 0) { setManualStatus('No students selected.'); return; }
      let count = 0;
      for (const studentId of selectedIds) {
        await axios.post('http://localhost:8080/api/attendance/manual-mark', {
          studentId: parseInt(studentId), sessionId: 1,
          subject: user?.subject || 'General', status,
        });
        count++;
      }
      setManualStatus(`Success! Marked ${count} students as ${status}.`);
      setSelectedStudents({});
      let url = 'http://localhost:8080/api/attendance/session/1';
      if (userRole === 'TEACHER' && user?.subject) url += `?subject=${encodeURIComponent(user.subject)}`;
      const response = await axios.get(url);
      setAttendanceData(response.data);
    } catch (err) { setManualStatus('Error: ' + err.message); }
  };

  const toggleStudentSelection = (id) => setSelectedStudents(prev => ({ ...prev, [id]: !prev[id] }));

  const handleFileChange = (e) => { if (e.target.files?.[0]) { setUploadFile(e.target.files[0]); setUploadStatus(''); setUploadResult(null); } };
  const handleUpload = async () => {
    if (!uploadFile) { setUploadStatus('Please select a file first.'); return; }
    const formData = new FormData();
    formData.append('file', uploadFile);
    setUploadStatus('Uploading and analyzing...');
    try {
      const response = await axios.post('http://localhost:5000/process-class-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadStatus(`Analysis Complete: ${response.data.message || 'Done'}`);
      if (response.data.students) setUploadResult(response.data.students);
    } catch (error) { setUploadStatus('Error: Ensure Python AI Server (server.py) is running on port 5000.'); }
  };

  const handleExportCSV = () => {
    if (attendanceData.length === 0) { alert('No data to export!'); return; }
    const headers = ['Student ID', 'First Name', 'Last Name', 'Timestamp', 'Attention Score', 'Is Drowsy'];
    const rows = attendanceData.map(r => [r.student.rollNumber, r.student.firstName, r.student.lastName, new Date(r.timestamp).toLocaleString(), r.attentionScore, r.isDrowsy ? 'Yes' : 'No'].map(v => `"${v}"`));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `attendance_${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); window.URL.revokeObjectURL(url);
  };

  const uniqueStudents = new Set(attendanceData.map(r => r.student.id)).size;
  const drowsyAlerts = attendanceData.filter(r => r.isDrowsy).length;
  const avgAttention = attendanceData.length > 0 ? (attendanceData.reduce((a, c) => a + c.attentionScore, 0) / attendanceData.length).toFixed(1) : 0;

  const chartData = {
    labels: attendanceData.map(r => new Date(r.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Attention Score',
      data: attendanceData.map(r => r.attentionScore),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#8b5cf6',
      pointRadius: 3,
    }],
  };

  const filteredData = attendanceData.filter(r => {
    const m = r.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (!m) return false;
    if (statusFilter === 'DROWSY') return r.isDrowsy;
    if (statusFilter === 'LOW_ATTENTION') return r.attentionScore < 50;
    return true;
  });

  // Class cards for carousel
  const classCards = user?.assignedClasses
    ? user.assignedClasses.split(',').map(cls => cls.trim())
    : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero Header with Parallax */}
      <div className="relative overflow-hidden py-10 px-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(34,211,238,0.04) 100%)' }}>
        <FloatingOrbs />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <AnimatedSection variant="fadeLeft">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                    {userRole} VIEW
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: '#22d3ee' }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Live
                  </span>
                </div>
                <h1 className="text-3xl font-bold font-display text-white">
                  {userRole === 'TEACHER'
                    ? `${user?.subject || 'Teacher'} Dashboard`
                    : 'Administration Dashboard'}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Real-time AI-powered classroom monitoring
                </p>
              </div>
            </AnimatedSection>
            <AnimatedSection variant="fadeRight" delay={0.1}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}
              >
                <Download size={16} /> Export CSV
              </motion.button>
            </AnimatedSection>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Teacher Tabs */}
        {userRole === 'TEACHER' && (
          <AnimatedSection variant="fade">
            <div className="flex space-x-2 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { id: 'dashboard', label: 'AI Monitoring', Icon: Activity },
                { id: 'manual-attendance', label: 'Manual Attendance', Icon: ClipboardList },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: activeTab === id ? 'white' : 'var(--color-text-muted)' }}
                >
                  {activeTab === id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))', border: '1px solid rgba(99,102,241,0.4)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2"><Icon size={16} />{label}</span>
                </button>
              ))}
            </div>
          </AnimatedSection>
        )}

        {/* Manual Attendance */}
        {activeTab === 'manual-attendance' && (
          <AnimatedSection variant="fadeUp">
            <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                  <CheckCircle className="text-emerald-400" size={20} />
                  Mark Attendance — {user?.subject || 'General'}
                </h2>
                {user?.assignedClasses && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.assignedClasses.split(',').map(cls => (
                      <button key={cls}
                        onClick={() => setManualClassFilter(cls.trim())}
                        className="px-3 py-1 text-xs rounded-lg font-semibold transition-all"
                        style={manualClassFilter === cls.trim()
                          ? { background: '#6366f1', color: 'white' }
                          : { background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                      >{cls.trim()}</button>
                    ))}
                    <button onClick={() => setManualClassFilter('')} className="text-xs underline" style={{ color: 'var(--color-text-muted)' }}>Clear</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <input type="text" placeholder="Filter by class..."
                  className="dark-input flex-1 px-4 py-2 rounded-xl text-sm"
                  value={manualClassFilter} onChange={e => setManualClassFilter(e.target.value)} />
                <span className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                  {students.filter(s => {
                    if (user?.assignedClasses) { const a = user.assignedClasses.split(',').map(c => c.trim().toLowerCase()); if (!s.className || !a.includes(s.className.toLowerCase())) return false; }
                    return !manualClassFilter || (s.className && s.className.toLowerCase().includes(manualClassFilter.toLowerCase()));
                  }).length} found
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto mb-6 pr-1">
                {students.filter(s => {
                  if (user?.assignedClasses) { const a = user.assignedClasses.split(',').map(c => c.trim().toLowerCase()); if (!s.className || !a.includes(s.className.toLowerCase())) return false; }
                  return !manualClassFilter || (s.className && s.className.toLowerCase().includes(manualClassFilter.toLowerCase()));
                }).map((s, idx) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                    onClick={() => toggleStudentSelection(s.id)}
                    className="p-3 rounded-xl cursor-pointer transition-all select-none flex justify-between items-center"
                    style={selectedStudents[s.id]
                      ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    whilehover={{ scale: 1.01 }}
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">{s.rollNumber}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.firstName} {s.lastName}</p>
                      <p className="text-xs mt-0.5 font-bold" style={{ color: '#818cf8' }}>{s.className || 'NO CLASS'}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${selectedStudents[s.id] ? 'bg-emerald-500' : 'border border-white/20'}`}>
                      {selectedStudents[s.id] && <CheckCircle size={12} className="text-white" />}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="pt-4 border-t flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="text-white font-bold">{Object.values(selectedStudents).filter(Boolean).length}</span> selected
                </span>
                <div className="flex gap-2">
                  {[{ status: 'PRESENT', label: 'Mark Present', color: '#059669', bg: 'rgba(5,150,105,0.8)', Icon: CheckCircle },
                    { status: 'ABSENT', label: 'Mark Absent', color: '#ef4444', bg: 'rgba(239,68,68,0.8)', Icon: X }
                  ].map(({ status, label, bg, Icon }) => (
                    <motion.button key={status} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleManualSubmit(status)}
                      disabled={Object.values(selectedStudents).filter(Boolean).length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: bg }}>
                      <Icon size={16} />{label}
                    </motion.button>
                  ))}
                </div>
              </div>
              {manualStatus && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl text-center text-sm font-medium"
                  style={manualStatus.includes('Error') ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' } : { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {manualStatus}
                </motion.div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* Teacher Class Carousel */}
        {activeTab === 'dashboard' && userRole === 'TEACHER' && classCards.length > 0 && (
          <AnimatedSection variant="fadeUp" delay={0.1}>
            <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
              <h2 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
                <Users size={18} className="text-indigo-400" /> My Classes
              </h2>
              <Carousel
                items={classCards}
                renderItem={(cls) => {
                  const count = students.filter(s => s.className?.toLowerCase() === cls.toLowerCase()).length;
                  const present = attendanceData.filter(r => r.student?.className?.toLowerCase() === cls.toLowerCase()).length;
                  return (
                    <TiltCard className="glass-strong rounded-xl p-5 mx-4" glowColor="rgba(99,102,241,0.25)">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold font-display text-white">{cls}</h3>
                          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{count} students enrolled</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                          LIVE
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <p className="text-2xl font-bold text-emerald-400">{present}</p>
                          <p className="text-xs mt-0.5 text-emerald-600">Present</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <p className="text-2xl font-bold text-red-400">{count - present}</p>
                          <p className="text-xs mt-0.5 text-red-600">Absent</p>
                        </div>
                      </div>
                      <button onClick={() => { setActiveTab('manual-attendance'); setManualClassFilter(cls); }}
                        className="mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-colors"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                        Open Manual Attendance →
                      </button>
                    </TiltCard>
                  );
                }}
              />
            </div>
          </AnimatedSection>
        )}

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            {/* Photo Upload */}
            <AnimatedSection variant="fadeUp" delay={0.15}>
              <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                <h2 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
                  <span>📸</span> Upload Class Photo
                </h2>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <input type="file" accept="image/*" onChange={handleFileChange}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white file:cursor-pointer"
                    style={{ '--tw-file-text': 'white', color: 'var(--color-text-muted)' }}
                  />
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleUpload} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
                    Analyze & Mark
                  </motion.button>
                </div>
                {uploadStatus && (
                  <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    {uploadStatus}
                  </div>
                )}
                {uploadResult && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uploadResult.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs"
                        style={s.status === 'Success' ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' } : { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                        {s.id} ({Math.round((1 - s.confidence) * 100)}% match)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatedSection variant="fadeUp" delay={0}>
                <StatCard icon={Users} label="Students Present" value={uniqueStudents} color="#6366f1" glowColor="rgba(99,102,241,0.3)" />
              </AnimatedSection>
              <AnimatedSection variant="fadeUp" delay={0.1}>
                <StatCard icon={Activity} label="Avg Attention Score" value={parseFloat(avgAttention)} suffix="%" color="#22d3ee" glowColor="rgba(34,211,238,0.3)" />
              </AnimatedSection>
              <AnimatedSection variant="fadeUp" delay={0.2}>
                <StatCard icon={AlertTriangle} label="Drowsiness Alerts" value={drowsyAlerts} color="#f59e0b" glowColor="rgba(245,158,11,0.3)" />
              </AnimatedSection>
            </div>

            {/* Chart + Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <AnimatedSection variant="fadeLeft" delay={0.1} className="lg:col-span-2">
                <div className="glass rounded-2xl p-6 h-full" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                  <h2 className="text-lg font-bold font-display text-white mb-4">Attention Trend</h2>
                  <div className="h-64">
                    {loading ? (
                      <div className="h-full rounded-xl shimmer-bg" />
                    ) : (
                      <Line data={chartData} options={chartOptions} />
                    )}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection variant="fadeRight" delay={0.15}>
                <div className="glass rounded-2xl p-6 h-full" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold font-display text-white">Live Activity</h2>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                      {filteredData.length} records
                    </span>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--color-text-muted)' }} />
                      <input type="text" placeholder="Search..." className="dark-input w-full pl-8 pr-3 py-2 rounded-lg text-xs"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Filter size={14} className="absolute left-2.5 top-2.5" style={{ color: 'var(--color-text-muted)' }} />
                      <select className="dark-input pl-7 pr-2 py-2 rounded-lg text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="ALL">All</option>
                        <option value="DROWSY">💤 Drowsy</option>
                        <option value="LOW_ATTENTION">⚠️ Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-56 pr-1">
                    {filteredData.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No records found</div>
                    ) : (
                      filteredData.slice().reverse().map((record, idx) => (
                        <motion.div key={idx}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-2.5 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <div>
                            <p className="text-xs font-semibold text-white">{record.student.firstName} {record.student.lastName}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              {record.student.rollNumber} · {new Date(record.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${record.attentionScore > 80 ? 'text-emerald-400' : record.attentionScore > 60 ? 'text-amber-400' : 'text-red-400'}`}
                              style={record.attentionScore > 80 ? { background: 'rgba(16,185,129,0.1)' } : record.attentionScore > 60 ? { background: 'rgba(245,158,11,0.1)' } : { background: 'rgba(239,68,68,0.1)' }}>
                              {record.attentionScore}%
                            </span>
                            {record.isDrowsy && (
                              <span className="text-xs px-1.5 py-0.5 rounded animate-pulse" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>💤</span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
