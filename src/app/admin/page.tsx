"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  Users, UserCheck, BookOpen, Building2, Search, Plus, Trash2,
  Activity, X, LogOut, Sun, Moon, Shield, ChevronDown
} from "lucide-react";

type Tab = "students" | "faculty" | "courses" | "departments";

interface Dept { id: string; code: string; name: string; sections: Array<{ id: string; name: string; year: number }>; _count: { students: number; faculty: number; courses: number } }
interface StudentRow { id: string; rollNumber: string; regNumber: string; year: number; semester: number; user: { id: string; name: string; email: string }; department: { code: string }; section: { name: string } }
interface FacultyRow { id: string; employeeId: string; designation: string; user: { id: string; name: string; email: string }; department: { code: string; name: string } }
interface CourseRow { id: string; code: string; name: string; credits: number; semester: number; courseType: string; department: { code: string }; assignments: Array<{ faculty: { user: { name: string } } }>; _count: { enrollments: number } }

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
        }`}
    >
      <span className={active ? "text-white dark:text-zinc-900" : "text-zinc-400"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

export default function AdminPanel() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("students");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ type: Tab; mode: "create" } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "students") {
        const t = await getAuthToken(); const r = await fetch(`/api/admin/students?search=${search}`, { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json(); setStudents(d.students || []);
      } else if (tab === "faculty") {
        const t = await getAuthToken(); const r = await fetch("/api/admin/faculty", { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json(); setFaculty(d.faculty || []);
      } else if (tab === "courses") {
        const t = await getAuthToken(); const r = await fetch("/api/admin/courses", { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json(); setCourses(d.courses || []);
      } else {
        const t = await getAuthToken(); const r = await fetch("/api/admin/departments", { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json(); setDepartments(d.departments || []);
      }
    } catch { showToast("Failed to load data"); }
    setLoading(false);
  }, [tab, search, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      const t = await getAuthToken(); const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok) { showToast(`${tab.slice(0, -1)} created`); setModal(null); setForm({}); fetchData(); }
      else showToast(d.error || "Failed");
    } catch { showToast("Failed to create"); }
    setLoading(false);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const t = await getAuthToken(); const r = await fetch(`/api/admin/${type}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) { showToast("Deleted"); fetchData(); }
      else { const d = await r.json(); showToast(d.error || "Failed"); }
    } catch { showToast("Failed to delete"); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "students", label: "Students", icon: Users },
    { key: "faculty", label: "Faculty", icon: UserCheck },
    { key: "courses", label: "Courses", icon: BookOpen },
    { key: "departments", label: "Departments", icon: Building2 },
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all";
  const labelClass = "text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5 ml-0.5";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-[var(--font-inter)] flex">

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-screen sticky top-0 p-4 gap-1"
      >
        <div className="px-2 py-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <Activity size={14} className="text-white dark:text-zinc-900" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">AttendAI</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 ml-9">Admin Console</p>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {tabs.map(t => (
            <NavItem key={t.key} icon={<t.icon size={16} />} label={t.label}
              active={tab === t.key} onClick={() => { setTab(t.key); setSearch(""); }} />
          ))}
        </nav>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col gap-1">
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button onClick={async () => { await signOut(auth); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              <Shield size={12} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{session?.user?.name || "Admin"}</p>
              <p className="text-[10px] text-zinc-400">Administrator</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <motion.header
          initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-white capitalize">{tab}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Manage {tab} records</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none w-52 focus:w-64 transition-all focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setModal({ type: tab, mode: "create" }); setForm({}); }}
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold flex items-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
              <Plus size={14} /> Add {tab.slice(0, -1)}
            </motion.button>
          </div>
        </motion.header>

        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                {/* Students */}
                {tab === "students" && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            {["Name", "Email", "Year/Sem", "Department", "Section", ""].map(h => (
                              <th key={h} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-5 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {students.map((s, i) => (
                            <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">{s.user.name.charAt(0)}</div>
                                  <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{s.user.name}</p>
                                    <p className="text-xs text-zinc-400 font-mono">{s.rollNumber}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-zinc-500 dark:text-zinc-400 font-mono">{s.user.email}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">Y{s.year}</span>
                                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg">S{s.semester}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">{s.department.code}</td>
                              <td className="px-5 py-3 text-sm text-zinc-400">{s.section.name}</td>
                              <td className="px-5 py-3">
                                <button onClick={() => handleDelete("students", s.id)}
                                  className="p-2 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {students.length === 0 && (
                      <div className="py-20 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                        <Users size={24} /><p className="text-sm">No students found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Faculty */}
                {tab === "faculty" && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
                          {["Name", "Email", "Employee ID", "Designation", "Department"].map(h => (
                            <th key={h} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-5 py-3">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {faculty.map((f, i) => (
                            <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400">{f.user.name.charAt(0)}</div>
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{f.user.name}</p>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-zinc-500 dark:text-zinc-400 font-mono">{f.user.email}</td>
                              <td className="px-5 py-3 text-sm font-mono text-zinc-600 dark:text-zinc-400">{f.employeeId}</td>
                              <td className="px-5 py-3"><span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">{f.designation}</span></td>
                              <td className="px-5 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">{f.department.code}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {faculty.length === 0 && <div className="py-20 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700"><UserCheck size={24} /><p className="text-sm">No faculty found</p></div>}
                  </div>
                )}

                {/* Courses */}
                {tab === "courses" && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
                          {["Code", "Name", "Credits", "Semester", "Faculty", "Enrolled", "Dept"].map(h => (
                            <th key={h} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-5 py-3">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {courses.map((c, i) => (
                            <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="px-5 py-3 text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">{c.code}</td>
                              <td className="px-5 py-3 text-sm font-medium text-zinc-900 dark:text-white">{c.name}</td>
                              <td className="px-5 py-3 text-sm text-zinc-500">{c.credits}</td>
                              <td className="px-5 py-3 text-sm text-zinc-500">Sem {c.semester}</td>
                              <td className="px-5 py-3 text-sm text-zinc-600 dark:text-zinc-400">{c.assignments[0]?.faculty?.user?.name || "Unassigned"}</td>
                              <td className="px-5 py-3 text-sm text-zinc-500">{c._count.enrollments}</td>
                              <td className="px-5 py-3 text-sm text-zinc-400">{c.department.code}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {courses.length === 0 && <div className="py-20 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700"><BookOpen size={24} /><p className="text-sm">No courses found</p></div>}
                  </div>
                )}

                {/* Departments */}
                {tab === "departments" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((d, i) => (
                      <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{d.code}</p>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{d.name}</h3>
                          </div>
                          <Building2 size={18} className="text-zinc-200 dark:text-zinc-700" />
                        </div>
                        <div className="flex gap-2 flex-wrap mb-4">
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">{d._count.students} Students</span>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1 rounded-lg">{d._count.faculty} Faculty</span>
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">{d._count.courses} Courses</span>
                        </div>
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <p className="text-xs text-zinc-400 mb-2">Sections</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.sections.map(s => (
                              <span key={s.id} className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">{s.name}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {departments.length === 0 && <div className="col-span-2 py-20 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700"><Building2 size={24} /><p className="text-sm">No departments found</p></div>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <motion.nav initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 py-2">
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative flex-1">
              {active && <motion.div layoutId="admin-mobile" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl" transition={{ type: "spring", damping: 20, stiffness: 300 }} />}
              <span className={`relative z-10 ${active ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}><t.icon size={16} /></span>
              <span className={`relative z-10 text-[10px] font-medium ${active ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>{t.label}</span>
            </button>
          );
        })}
      </motion.nav>

      {/* Create Modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div key="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setModal(null)} />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 w-[420px] max-w-[90vw] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Create new</p>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white capitalize">{modal.type.slice(0, -1)}</h3>
                </div>
                <button onClick={() => setModal(null)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                {modal.type === "students" && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Name *</label><input className={inputClass} placeholder="Full name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div><label className={labelClass}>Email *</label><input className={inputClass} placeholder="name@email.com" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  </div>
                  <div><label className={labelClass}>Password</label><input className={inputClass} type="password" placeholder="student123 (default)" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Roll Number *</label><input className={inputClass} placeholder="Roll no." value={form.rollNumber || ""} onChange={e => setForm({ ...form, rollNumber: e.target.value })} /></div>
                    <div><label className={labelClass}>Reg Number</label><input className={inputClass} placeholder="Reg no." value={form.regNumber || ""} onChange={e => setForm({ ...form, regNumber: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelClass}>Year</label><input className={inputClass} type="number" placeholder="2" value={form.year || ""} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
                    <div><label className={labelClass}>Semester</label><input className={inputClass} type="number" placeholder="4" value={form.semester || ""} onChange={e => setForm({ ...form, semester: e.target.value })} /></div>
                    <div><label className={labelClass}>Batch</label><input className={inputClass} type="number" placeholder="2026" value={form.batchYear || ""} onChange={e => setForm({ ...form, batchYear: e.target.value })} /></div>
                  </div>
                  <div><label className={labelClass}>Department *</label>
                    <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Select</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </div>
                  <div><label className={labelClass}>Section *</label>
                    <select className={inputClass} value={form.sectionId || ""} onChange={e => setForm({ ...form, sectionId: e.target.value })}>
                      <option value="">Select</option>
                      {departments.flatMap(d => d.sections).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </>)}

                {modal.type === "faculty" && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Name *</label><input className={inputClass} placeholder="Full name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div><label className={labelClass}>Email *</label><input className={inputClass} placeholder="name@email.com" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  </div>
                  <div><label className={labelClass}>Employee ID *</label><input className={inputClass} placeholder="FAC-001" value={form.employeeId || ""} onChange={e => setForm({ ...form, employeeId: e.target.value })} /></div>
                  <div><label className={labelClass}>Designation</label><input className={inputClass} placeholder="Professor" value={form.designation || ""} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
                  <div><label className={labelClass}>Department *</label>
                    <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Select</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </div>
                </>)}

                {modal.type === "courses" && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Code *</label><input className={inputClass} placeholder="CS301" value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                    <div><label className={labelClass}>Name *</label><input className={inputClass} placeholder="Course name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelClass}>Credits</label><input className={inputClass} type="number" placeholder="4" value={form.credits || ""} onChange={e => setForm({ ...form, credits: e.target.value })} /></div>
                    <div><label className={labelClass}>Semester *</label><input className={inputClass} type="number" placeholder="6" value={form.semester || ""} onChange={e => setForm({ ...form, semester: e.target.value })} /></div>
                    <div><label className={labelClass}>Type</label>
                      <select className={inputClass} value={form.courseType || "LECTURE"} onChange={e => setForm({ ...form, courseType: e.target.value })}>
                        <option>LECTURE</option><option>LAB</option><option>PRACTICAL</option>
                      </select>
                    </div>
                  </div>
                  <div><label className={labelClass}>Department *</label>
                    <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Select</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                    </select>
                  </div>
                </>)}

                {modal.type === "departments" && (<>
                  <div><label className={labelClass}>Code *</label><input className={inputClass} placeholder="CSE" value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                  <div><label className={labelClass}>Name *</label><input className={inputClass} placeholder="Computer Science" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className={labelClass}>Sections</label><input className={inputClass} placeholder="A, B (comma-separated)" value={form.sectionNames || ""} onChange={e => setForm({ ...form, sectionNames: e.target.value })} /></div>
                </>)}
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={loading}
                  className="flex-[2] py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 dark:border-zinc-400 border-t-white dark:border-t-zinc-900 rounded-full" /> : "Create"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
