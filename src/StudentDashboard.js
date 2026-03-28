import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Camera, Calendar, Clock, AlertTriangle } from 'lucide-react';
import AnimatedSection from './components/AnimatedSection';
import AnimatedCounter from './components/AnimatedCounter';
import TiltCard from './components/TiltCard';

const StudentDashboard = ({ user }) => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, avgAttention: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user.studentId && user.studentProfile) user.studentId = user.studentProfile.id;
      if (!user.studentId) return;
      try {
        const response = await axios.get(`http://localhost:8080/api/attendance/student/${user.studentId}`);
        const data = response.data;
        setAttendance(data);
        const presentCount = data.length;
        const avgAtt = data.length ? (data.reduce((a, b) => a + b.attentionScore, 0) / data.length).toFixed(1) : 0;
        setStats({ present: presentCount, avgAttention: avgAtt });
      } catch (error) { console.error('Error fetching student data', error); }
    };
    fetchAttendance();
  }, [user]);

  const percentage = stats.present > 0 ? Math.min(100, (stats.present / 30) * 100).toFixed(0) : 0; // eslint-disable-line no-unused-vars

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden py-10 px-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.05) 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <AnimatedSection variant="fadeUp">
            <TiltCard className="glass rounded-2xl p-6" glowColor="rgba(139,92,246,0.3)" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl font-display"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}
                  >
                    {(user.studentProfile?.firstName || user.username || 'S')[0].toUpperCase()}
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold font-display text-white">
                      Welcome, {user.studentProfile?.firstName || 'Student'}!
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Roll No: {user.username}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-center">
                  <div className="px-5 py-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#34d399' }}>Classes</p>
                    <p className="text-3xl font-bold text-emerald-400 font-display">
                      <AnimatedCounter target={stats.present} />
                    </p>
                  </div>
                  <div className="px-5 py-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#818cf8' }}>Avg Attention</p>
                    <p className={`text-3xl font-bold font-display ${parseFloat(stats.avgAttention) > 75 ? 'text-indigo-400' : 'text-amber-400'}`}>
                      <AnimatedCounter target={parseFloat(stats.avgAttention)} suffix="%" />
                    </p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </AnimatedSection>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* How-to banner */}
        <AnimatedSection variant="fadeUp" delay={0.1}>
          <div className="glass rounded-2xl p-4 flex items-start gap-4" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,211,238,0.15)' }}>
              <Camera size={18} style={{ color: '#22d3ee' }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">How to Mark Attendance?</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Your attendance is marked automatically via the <span className="text-cyan-400 font-semibold">Classroom AI Camera</span>. Simply look at the camera when entering class.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Attendance Log Table */}
        <AnimatedSection variant="fadeUp" delay={0.2}>
          <div className="glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.05)' }}>
              <Calendar size={18} style={{ color: '#818cf8' }} />
              <h3 className="font-bold text-white font-display">Attendance History</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                {attendance.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <tr>
                    {['Date', 'Subject', 'Time', 'Status', 'Attention', 'Alerts'].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? (
                    attendance.slice().reverse().map((record, idx) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.04, duration: 0.4 }}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <Calendar size={13} style={{ color: '#818cf8' }} />
                            {new Date(record.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                            {record.subject || 'General'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <Clock size={13} style={{ color: '#818cf8' }} />
                            {new Date(record.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold`}
                            style={record.status === 'PRESENT' ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' } : { background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${record.attentionScore}%` }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.04 + 0.2, duration: 0.8 }}
                                className="h-1.5 rounded-full"
                                style={{ background: record.attentionScore > 75 ? '#34d399' : '#fbbf24' }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-white">{record.attentionScore}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {record.isDrowsy && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg w-fit" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                              <AlertTriangle size={11} /> Drowsy
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        No attendance records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default StudentDashboard;
