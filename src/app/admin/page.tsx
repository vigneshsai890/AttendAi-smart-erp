"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import Magnetic from "@/components/Magnetic";
import {
  Users, UserCheck, BookOpen, Building2,
  Search, Plus, Trash2, ShieldCheck,
  ChevronRight, ExternalLink, Activity,
  Database, Zap, Lock
} from "lucide-react";

type Tab = "students" | "faculty" | "courses" | "departments";

interface Dept { id: string; code: string; name: string; sections: Array<{ id: string; name: string; year: number }>; _count: { students: number; faculty: number; courses: number } }
interface StudentRow { id: string; rollNumber: string; regNumber: string; year: number; semester: number; user: { id: string; name: string; email: string }; department: { code: string }; section: { name: string } }
interface FacultyRow { id: string; employeeId: string; designation: string; user: { id: string; name: string; email: string }; department: { code: string; name: string } }
interface CourseRow { id: string; code: string; name: string; credits: number; semester: number; courseType: string; department: { code: string }; assignments: Array<{ faculty: { user: { name: string } } }>; _count: { enrollments: number } }

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("students");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ type: Tab; mode: "create" } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Mouse Tracking for Spotlight Effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.getElementsByClassName("group");
      for (const card of cards as any) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "students") {
        const r = await fetch(`/api/admin/students?search=${search}`);
        const d = await r.json(); setStudents(d.students || []);
      } else if (tab === "faculty") {
        const r = await fetch("/api/admin/faculty");
        const d = await r.json(); setFaculty(d.faculty || []);
      } else if (tab === "courses") {
        const r = await fetch("/api/admin/courses");
        const d = await r.json(); setCourses(d.courses || []);
      } else {
        const r = await fetch("/api/admin/departments");
        const d = await r.json(); setDepartments(d.departments || []);
      }
    } catch { showToast("❌ Failed to load data", "error"); }
    setLoading(false);
  }, [tab, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/admin/${tab}`;
      let body: Record<string, unknown> = {};

      if (tab === "students") {
        body = { name: form.name, email: form.email, password: form.password || "student123", rollNumber: form.rollNumber, regNumber: form.regNumber || form.rollNumber, year: parseInt(form.year || "1"), semester: parseInt(form.semester || "1"), sectionId: form.sectionId, departmentId: form.departmentId, batchYear: parseInt(form.batchYear || String(new Date().getFullYear())) };
      } else if (tab === "faculty") {
        body = { name: form.name, email: form.email, password: form.password || "faculty123", employeeId: form.employeeId, designation: form.designation, departmentId: form.departmentId };
      } else if (tab === "courses") {
        body = { code: form.code, name: form.name, credits: parseInt(form.credits || "3"), courseType: form.courseType || "LECTURE", departmentId: form.departmentId, semester: parseInt(form.semester || "1"), facultyId: form.facultyId || undefined };
      } else {
        body = { code: form.code, name: form.name, description: form.description, sections: form.sectionNames ? form.sectionNames.split(",").map(s => ({ name: s.trim(), year: 1, batchYear: new Date().getFullYear() })) : [] };
      }

      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok) { showToast(`✅ ${tab.slice(0, -1)} created!`, "success"); setModal(null); setForm({}); fetchData(); }
      else showToast(`❌ ${d.error}`, "error");
    } catch { showToast("❌ Failed to create", "error"); }
    setLoading(false);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const r = await fetch(`/api/admin/${type}/${id}`, { method: "DELETE" });
      if (r.ok) { showToast("✅ Deleted!", "success"); fetchData(); }
      else { const d = await r.json(); showToast(`❌ ${d.error}`, "error"); }
    } catch { showToast("❌ Failed to delete", "error"); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "students", label: "Students", icon: Users },
    { key: "faculty", label: "Faculty", icon: UserCheck },
    { key: "courses", label: "Courses", icon: BookOpen },
    { key: "departments", label: "Departments", icon: Building2 },
  ];

  const inputClass = "w-full px-6 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-all shadow-inner text-sm font-medium";
  const labelClass = "text-[10px] font-black text-white/20 uppercase tracking-[0.3em] block mb-2 ml-1";

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans pb-32 relative overflow-hidden">
      <Background />
      <Navbar />

      {/* Vengance UI Aesthetic Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 inset-x-0 h-[500px] bg-gradient-to-t from-purple-500/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="relative z-10 pt-32 max-w-[1400px] mx-auto px-8">

        {/* Premium Admin System Hub Header */}
        <div className="relative mb-12 p-12 rounded-[4rem] overflow-hidden group border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent -z-10" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-1000" />

          <div className="absolute top-0 right-0 p-12 opacity-5 -z-10 group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
            <ShieldCheck size={320} strokeWidth={0.5} />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-8 text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ring-1 ring-white/5 shadow-2xl"
            >
              <Activity size={12} /> System Core · Neural Root
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 italic drop-shadow-2xl">
              Admin <span className="text-white/20">Terminal</span>
            </h1>
            <p className="text-[14px] text-white/40 font-bold uppercase tracking-wide leading-relaxed max-w-2xl">
              Execute high-privilege operations, manage institutional entities, and synchronize cryptographic credentials across the neural network.
            </p>
          </div>
        </div>

        {/* Control Matrix: Tabs + Action Hub */}
        <div className="flex flex-wrap items-center justify-between gap-8 mb-12 px-4">
          <div className="flex items-center gap-2 p-2 rounded-[2.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all relative overflow-hidden group/tab ${
                  tab === t.key
                    ? "bg-white text-black shadow-2xl scale-105"
                    : "text-white/30 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                <t.icon size={14} className={tab === t.key ? "text-indigo-600" : "text-white/20 group-hover/tab:text-white/40"} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 flex-1 max-w-xl">
            <div className="relative flex-1 group/search">
              <div className="absolute inset-y-0 left-6 flex items-center text-white/20 group-focus-within/search:text-indigo-400 transition-colors">
                <Search size={18} />
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Query Registry..."
                className="w-full pl-16 pr-8 py-5 rounded-[2.5rem] bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 text-[12px] font-black uppercase tracking-widest focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-all shadow-inner ring-1 ring-white/5"
              />
            </div>

            <Magnetic strength={0.2}>
              <button
                onClick={() => { setModal({ type: tab, mode: "create" }); setForm({}); }}
                className="whitespace-nowrap px-10 py-5 rounded-[2.5rem] bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-400 hover:scale-105 active:scale-95 transition-all ring-1 ring-white/20"
              >
                <Plus size={16} className="inline-block mr-2" /> New Entity
              </button>
            </Magnetic>
          </div>
        </div>

        {/* Main Data Matrix: The Glass Grid */}
        <div className="p-1 rounded-[4.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
           {/* Spotlight Overlay */}
           <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: `radial-gradient(1200px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99,102,241,0.04), transparent 40%)` }}
          />

          <div className="p-10 overflow-x-auto relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-12 h-12 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.2)]" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">Syncing with Registry...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab === "students" && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {["Identity", "Credentials", "Temporal State", "Registry Node", "Status", "Actions"].map(h => (
                            <th key={h} className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 p-6 text-left border-b border-white/[0.05]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {students.map(s => (
                          <tr key={s.id} className="group/row hover:bg-white/[0.02] transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black italic">
                                  {s.user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-[14px] font-black text-white/90 group-hover/row:text-white transition-colors italic">{s.user.name}</div>
                                  <div className="text-[10px] text-white/20 font-mono uppercase tracking-tighter">{s.rollNumber}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-[12px] text-white/40 font-mono group-hover/row:text-white/60 transition-colors">{s.user.email}</td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40">Y{s.year}</span>
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400">S{s.semester}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="text-[12px] font-black text-white/60">{s.department.code}</div>
                              <div className="text-[10px] text-white/20 font-bold uppercase">SEC {s.section.name}</div>
                            </td>
                            <td className="p-6">
                              <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> SYNCED
                              </span>
                            </td>
                            <td className="p-6">
                              <button onClick={() => handleDelete("students", s.id)} className="p-3 rounded-xl bg-red-500/5 text-red-500/40 border border-red-500/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {tab === "faculty" && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {["Faculty Node", "Neural Access", "Designation", "Node Group", "Auth", "Actions"].map(h => (
                            <th key={h} className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 p-6 text-left border-b border-white/[0.05]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {faculty.map(f => (
                          <tr key={f.id} className="group/row hover:bg-white/[0.02] transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black italic">
                                  {f.user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-[14px] font-black text-white/90 group-hover/row:text-white transition-colors italic">{f.user.name}</div>
                                  <div className="text-[10px] text-white/20 font-mono uppercase tracking-tighter">{f.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-[12px] text-white/40 font-mono group-hover/row:text-white/60 transition-colors">{f.user.email}</td>
                            <td className="p-6">
                              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest">{f.designation}</span>
                            </td>
                            <td className="p-6 text-[12px] font-black text-indigo-400">{f.department.code}</td>
                            <td className="p-6">
                              <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> VERIFIED
                              </span>
                            </td>
                            <td className="p-6">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {tab === "courses" && (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {["Code", "Entity Name", "Credits", "Temporal", "Assigned Faculty", "Enrollments", "Registry"].map(h => (
                            <th key={h} className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 p-6 text-left border-b border-white/[0.05]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {courses.map(c => (
                          <tr key={c.id} className="group/row hover:bg-white/[0.02] transition-colors">
                            <td className="p-6 font-mono font-black text-indigo-400 text-[13px]">{c.code}</td>
                            <td className="p-6 text-[14px] font-black text-white/90 group-hover/row:text-white italic">{c.name}</td>
                            <td className="p-6">
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-white/40">{c.credits}</div>
                            </td>
                            <td className="p-6 text-[12px] font-black text-white/40">SEM {c.semester}</td>
                            <td className="p-6">
                              <div className="text-[12px] font-black text-white/80 italic">{c.assignments[0]?.faculty?.user?.name || "UNASSIGNED"}</div>
                              <div className="text-[9px] text-white/20 uppercase font-black tracking-widest">{c.courseType}</div>
                            </td>
                            <td className="p-6">
                              <div className="text-[12px] font-black text-white/60">{c._count.enrollments} Students</div>
                            </td>
                            <td className="p-6 text-[11px] font-black text-white/30">{c.department.code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {tab === "departments" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                      {departments.map(d => (
                        <div key={d.id} className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all relative overflow-hidden group/dept shadow-2xl">
                          <div className="absolute top-0 right-0 p-8 text-white/[0.02] -z-10 group-hover/dept:scale-110 group-hover/dept:text-white/[0.05] transition-all duration-700">
                            <Building2 size={120} strokeWidth={0.5} />
                          </div>

                          <div className="flex items-start justify-between mb-8">
                            <div>
                              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2 font-mono">{d.code}</div>
                              <h3 className="text-3xl font-black text-white italic tracking-tight">{d.name}</h3>
                            </div>
                            <div className="p-4 rounded-[1.5rem] bg-white/5 border border-white/10">
                              <ExternalLink size={18} className="text-white/20" />
                            </div>
                          </div>

                          <div className="flex gap-4 flex-wrap mb-8">
                            <div className="px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">{d._count.students} Students</div>
                            <div className="px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase tracking-widest">{d._count.faculty} Faculty</div>
                            <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">{d._count.courses} Courses</div>
                          </div>

                          <div className="pt-8 border-t border-white/[0.03]">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Linked Clusters (Sections)</p>
                            <div className="flex flex-wrap gap-3">
                              {d.sections.map(s => (
                                <span key={s.id} className="text-[10px] font-bold text-white/40 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">{s.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {((tab === "students" && students.length === 0) ||
                    (tab === "faculty" && faculty.length === 0) ||
                    (tab === "courses" && courses.length === 0) ||
                    (tab === "departments" && departments.length === 0)) && (
                    <div className="py-32 flex flex-col items-center justify-center text-white/10 space-y-6">
                      <Database size={48} strokeWidth={1} />
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] italic">No Entities Identified in Segment</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE ENTITY MODAL: The Neural Forge ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <motion.div
              initial={{ opacity: 0, bg: "rgba(0,0,0,0)" }}
              animate={{ opacity: 1, bg: "rgba(0,0,0,0.8)" }}
              exit={{ opacity: 0, bg: "rgba(0,0,0,0)" }}
              className="absolute inset-0 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto rounded-[4rem] bg-[#0c0c0e] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] relative z-10 p-12 custom-scrollbar"
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] -z-10 pointer-events-none">
                <Zap size={240} strokeWidth={0.5} />
              </div>

              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                    <Plus size={10} /> Data Forge
                  </div>
                  <h3 className="text-3xl font-black text-white italic tracking-tight">
                    {modal.type === "students" ? "Initialize Student" : modal.type === "faculty" ? "Register Faculty" : modal.type === "courses" ? "Deploy Course" : "Create Node"}
                  </h3>
                </div>
                <button onClick={() => setModal(null)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>
              </div>

              <div className="space-y-6">
                {modal.type === "students" && (<>
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className={labelClass}>Full Name *</label><input className={inputClass} placeholder="Neural Identity" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className={labelClass}>Email *</label><input className={inputClass} placeholder="ID@apollo.edu" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  </div>
                  <div><label className={labelClass}>Password Override</label><input className={inputClass} type="password" placeholder="student123 (Default)" value={form.password || ""} onChange={e => setForm({...form, password: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className={labelClass}>Roll Number *</label><input className={inputClass} placeholder="Temporal ID" value={form.rollNumber || ""} onChange={e => setForm({...form, rollNumber: e.target.value})} /></div>
                    <div><label className={labelClass}>Reg Number</label><input className={inputClass} placeholder="Registry ID" value={form.regNumber || ""} onChange={e => setForm({...form, regNumber: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div><label className={labelClass}>Cycle (Year)</label><input className={inputClass} type="number" placeholder="2" value={form.year || ""} onChange={e => setForm({...form, year: e.target.value})} /></div>
                    <div><label className={labelClass}>Sync (Sem)</label><input className={inputClass} type="number" placeholder="4" value={form.semester || ""} onChange={e => setForm({...form, semester: e.target.value})} /></div>
                    <div><label className={labelClass}>Batch</label><input className={inputClass} type="number" placeholder="2026" value={form.batchYear || ""} onChange={e => setForm({...form, batchYear: e.target.value})} /></div>
                  </div>
                  <div>
                    <label className={labelClass}>Department Node *</label>
                    <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({...form, departmentId: e.target.value})}>
                      <option value="">Select segment</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Section Cluster *</label>
                    <select className={inputClass} value={form.sectionId || ""} onChange={e => setForm({...form, sectionId: e.target.value})}>
                      <option value="">Select cluster</option>
                      {departments.flatMap(d => d.sections).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </>)}

                {modal.type === "faculty" && (<>
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className={labelClass}>Full Name *</label><input className={inputClass} placeholder="Expert Identity" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                    <div><label className={labelClass}>Email *</label><input className={inputClass} placeholder="Node@apollo.edu" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  </div>
                  <div><label className={labelClass}>Employee ID *</label><input className={inputClass} placeholder="FAC-IDENTITY" value={form.employeeId || ""} onChange={e => setForm({...form, employeeId: e.target.value})} /></div>
                  <div><label className={labelClass}>Designation</label><input className={inputClass} placeholder="Core Researcher / Professor" value={form.designation || ""} onChange={e => setForm({...form, designation: e.target.value})} /></div>
                  <div>
                    <label className={labelClass}>Department Node *</label>
                    <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({...form, departmentId: e.target.value})}>
                      <option value="">Select segment</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </div>
                </>)}

                {modal.type === "courses" && (<>
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className={labelClass}>Course Code *</label><input className={inputClass} placeholder="NEURAL-501" value={form.code || ""} onChange={e => setForm({...form, code: e.target.value})} /></div>
                    <div><label className={labelClass}>Entity Name *</label><input className={inputClass} placeholder="Advanced Cryptography" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div><label className={labelClass}>Credits</label><input className={inputClass} type="number" placeholder="4" value={form.credits || ""} onChange={e => setForm({...form, credits: e.target.value})} /></div>
                    <div><label className={labelClass}>Semester *</label><input className={inputClass} type="number" placeholder="6" value={form.semester || ""} onChange={e => setForm({...form, semester: e.target.value})} /></div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select className={inputClass} value={form.courseType || "LECTURE"} onChange={e => setForm({...form, courseType: e.target.value})}>
                        <option>LECTURE</option><option>LAB</option><option>PRACTICAL</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Department Node *</label>
                    <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({...form, departmentId: e.target.value})}>
                      <option value="">Select segment</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </div>
                </>)}

                {modal.type === "departments" && (<>
                  <div><label className={labelClass}>Node Code *</label><input className={inputClass} placeholder="CSE-NEURAL" value={form.code || ""} onChange={e => setForm({...form, code: e.target.value})} /></div>
                  <div><label className={labelClass}>Segment Name *</label><input className={inputClass} placeholder="Neural Engineering" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div><label className={labelClass}>Cluster Specs (Sections)</label><input className={inputClass} placeholder="ALPHA, BETA (comma-separated)" value={form.sectionNames || ""} onChange={e => setForm({...form, sectionNames: e.target.value})} /></div>
                </>)}
              </div>

              <div className="mt-12 flex gap-4">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-5 rounded-[2rem] bg-white/[0.05] border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-[2] py-5 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock size={14} /> Commit Changes</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  );
}
