"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import io from "socket.io-client";
import axios from "axios";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Users, ShieldAlert, Activity, LayoutDashboard, QrCode } from "lucide-react";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

interface Course {
  _id: string;
  name: string;
  code: string;
  department: string;
}

export default function FacultyDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  
  // QR Session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(15);
  
  const rotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<any>(null);

  const { showToast } = useToast();

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/session/courses`);
      if (res.data.success) {
        setCourses(res.data.courses);
        if (res.data.courses.length > 0) setSelectedCourse(res.data.courses[0]);
      }
    } catch { 
      showToast("❌ Failed to load courses"); 
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchCourses(); 
  }, [fetchCourses]);

  // Handle Socket.io connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socketRef.current.on("attendance_marked", (attendanceRecord: any) => {
      setPresentStudents((prev) => {
        if (prev.find(p => p.studentId?._id === attendanceRecord.studentId?._id)) return prev;
        return [attendanceRecord, ...prev];
      });
      // Limit toast spam if scaling to 5000 students rapidly checking in
      // showToast(`✅ ${attendanceRecord.studentId?.name} joined!`);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const rotateQR = useCallback(async (sessionId: string) => {
    try {
      const res = await axios.get(`${API_URL}/session/generate-qr/${sessionId}`);
      if (res.data.success) {
        const qrDataUrl = await QRCode.toDataURL(res.data.token, { 
          width: 320, 
          margin: 1, 
          color: { dark: "#000000", light: "#ffffff" } 
        });
        setQrImageUrl(qrDataUrl);
        setQrTimer(15);
      }
    } catch (err) {
      console.error("Failed to rotate QR", err);
    }
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;
    rotateQR(activeSessionId);
    
    rotateRef.current = setInterval(() => {
      rotateQR(activeSessionId);
    }, 15000);

    const countdown = setInterval(() => {
      setQrTimer(prev => (prev > 0 ? prev - 1 : 15));
    }, 1000);

    return () => { 
      if (rotateRef.current) clearInterval(rotateRef.current); 
      clearInterval(countdown);
    };
  }, [activeSessionId, rotateQR]);

  const startSession = async () => {
    if (!selectedCourse) return showToast("Select a course first");
    setSessionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/session/create`, {
        courseName: selectedCourse.name,
        facultyId: "660c1234abcd5678ef901234" // hardcoded prof for demo
      });
      
      if (res.data.success) {
        const sessionId = res.data.session._id;
        setActiveSessionId(sessionId);
        setPresentStudents([]);
        
        socketRef.current.emit("join-session", sessionId);
        showToast(`✅ Live Session Started: ${selectedCourse.name}`);
      }
    } catch (err) { 
      showToast("❌ Failed to start session"); 
    }
    setSessionLoading(false);
  };

  const endSession = async () => {
    if (!activeSessionId) return;
    setSessionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/session/end/${activeSessionId}`);
      if (res.data.success) {
        showToast(`✅ Session ended. Total Present: ${presentStudents.length}`);
        setActiveSessionId(null);
        setQrImageUrl("");
      }
    } catch { 
      showToast("❌ Failed to end session"); 
    }
    setSessionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40">
      Loading Dashboard...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 relative overflow-hidden">
      {/* Vengance UI Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 inset-x-0 h-[500px] bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />
      
      <Navbar />

      <main className="relative z-10 pt-28 pb-20 max-w-[1400px] mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4 text-xs font-medium text-white/70">
              <LayoutDashboard size={14} /> Faculty Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white/90">
              Attendance <span className="text-white/40">Dashboard</span>
            </h1>
          </div>

          {/* Vengance/Apple Style Dropdown for Courses */}
          <div className="relative w-full md:w-[320px]">
            <label className="text-xs text-white/40 font-medium ml-1 mb-2 block uppercase tracking-wider">Select Subject</label>
            <button 
              onClick={() => !activeSessionId && setIsDropdownOpen(!isDropdownOpen)}
              disabled={!!activeSessionId}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border ${activeSessionId ? 'border-white/5 bg-white/5 opacity-60 cursor-not-allowed' : 'border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98]'} backdrop-blur-xl transition-all outline-none`}
            >
              <div className="flex flex-col items-start truncate pr-4">
                <span className="text-sm font-medium text-white/90 truncate">{selectedCourse?.name || "No Course Selected"}</span>
                <span className="text-xs text-white/40">{selectedCourse?.code || "---"}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-0 right-0 mt-2 p-1 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto"
                >
                  {courses.map(course => (
                    <button
                      key={course._id}
                      onClick={() => { setSelectedCourse(course); setIsDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm ${selectedCourse?._id === course._id ? "text-white font-medium" : "text-white/70"}`}>
                          {course.name}
                        </span>
                        <span className="text-xs text-white/30">{course.code}</span>
                      </div>
                      {selectedCourse?._id === course._id && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Attendance Table */}
          <div className="lg:col-span-8 p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold flex items-center gap-3">
                <Users className="text-white/40" /> Live Feed
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60">
                  {presentStudents.length.toLocaleString()} Scanned
                </span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10">
                  <tr>
                    <th className="pb-4 text-xs font-medium text-white/30 uppercase tracking-widest font-mono">Student Name</th>
                    <th className="pb-4 text-xs font-medium text-white/30 uppercase tracking-widest font-mono">Timestamp</th>
                    <th className="pb-4 text-xs font-medium text-white/30 uppercase tracking-widest font-mono text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {presentStudents.map((record, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 }}
                        key={record._id || i}
                        className="group"
                      >
                        <td className="py-4 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                          {record.studentId?.name || "Unknown"}
                        </td>
                        <td className="py-4 text-sm text-white/40 font-mono">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {presentStudents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4 pt-20">
                  <Activity className="w-12 h-12 opacity-50" />
                  <p className="text-sm">Waiting for real-time scans...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: QR Engine */}
          <div className="lg:col-span-4 p-6 rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-xl flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold flex items-center gap-3">
                <QrCode className="text-white/40" /> Engine
              </h2>
              {activeSessionId && (
                <span className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                </span>
              )}
            </div>

            {!activeSessionId ? (
              <div className="w-full flex-1 flex flex-col justify-center text-center space-y-6">
                <div className="w-32 h-32 mx-auto rounded-3xl border border-white/5 bg-white/5 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-white/20" />
                </div>
                <p className="text-sm text-white/40 leading-relaxed px-4">
                  Start a secure cryptographic session. A dynamic QR code will be generated and rotated every 15s to prevent fraud.
                </p>
                <button 
                  onClick={startSession} 
                  disabled={sessionLoading || !selectedCourse}
                  className="w-full py-4 rounded-2xl bg-white text-black font-semibold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                >
                  {sessionLoading ? "Initializing..." : "Start Secure Session"}
                </button>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col items-center text-center space-y-6">
                
                <div className="p-4 bg-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 z-10" />
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="Dynamic QR" className="w-[240px] h-[240px] rounded-xl relative z-0" />
                  ) : (
                    <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 animate-pulse rounded-xl" />
                  )}
                </div>

                <div className="w-full flex flex-col items-center space-y-2">
                  <div className="flex justify-between w-full px-2 text-xs font-mono text-white/40">
                    <span>Rotation Engine</span>
                    <span className={qrTimer <= 5 ? "text-red-400" : "text-emerald-400"}>00:{String(qrTimer).padStart(2, "0")}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white/80"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(qrTimer / 15) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>

                <button 
                  onClick={endSession} 
                  disabled={sessionLoading}
                  className="w-full mt-4 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-500/20 active:scale-[0.98] transition-all"
                >
                  {sessionLoading ? "Terminating..." : "End Session & Save"}
                </button>

              </div>
            )}
          </div>
        </div>

      </main>
      
      {/* Global minimal custom scrollbar override */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
