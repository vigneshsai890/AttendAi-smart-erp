"use client";

import { useEffect, useState, useCallback } from "react";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

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
    } catch { showToast("❌ Failed to load data"); }
    setLoading(false);
  }, [tab, search, showToast]);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      if (r.ok) { showToast(`✅ ${tab.slice(0, -1)} created!`); setModal(null); setForm({}); fetchData(); }
      else showToast(`❌ ${d.error}`);
    } catch { showToast("❌ Failed to create"); }
    setLoading(false);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const r = await fetch(`/api/admin/${type}/${id}`, { method: "DELETE" });
      if (r.ok) { showToast("✅ Deleted!"); fetchData(); }
      else { const d = await r.json(); showToast(`❌ ${d.error}`); }
    } catch { showToast("❌ Failed to delete"); }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "students", label: "Students", icon: "🎓" },
    { key: "faculty", label: "Faculty", icon: "👨‍🏫" },
    { key: "courses", label: "Courses", icon: "📚" },
    { key: "departments", label: "Departments", icon: "🏛️" },
  ];

  const inputClass = "w-full px-3 py-[10px] rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/25 focus:border-[#5EAEFF]/50 focus:ring-1 focus:ring-[#5EAEFF]/30 transition-all outline-none text-[12px] font-['DM_Sans',sans-serif]";
  const labelClass = "text-[9px] font-bold text-white/50 uppercase tracking-[0.8px] block mb-1 font-['DM_Sans',sans-serif]";

  return (
    <>
      <Background />
      <Navbar />
      <div className="relative z-10 pt-[60px]">
        <div className="max-w-[1280px] mx-auto px-[26px] py-[30px] pb-12">

          {/* Hero */}
          <div className="att-a1 relative overflow-hidden rounded-[22px] p-[26px_28px] mb-[22px] bg-gradient-to-br from-[rgba(167,139,250,.1)] via-[rgba(129,140,248,.06)] to-[rgba(94,174,255,.05)] border border-[rgba(167,139,250,.18)]">
            <div className="inline-flex items-center gap-[5px] text-[10px] font-bold uppercase tracking-[1.2px] text-[#A78BFA] bg-[rgba(167,139,250,.1)] border border-[rgba(167,139,250,.2)] rounded-full px-[10px] py-[3px] mb-[10px] font-['DM_Sans',sans-serif]">
              ⚙️ Administration
            </div>
            <h1 className="text-[clamp(20px,3.2vw,30px)] font-extrabold tracking-[-0.8px] leading-[1.1] bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-[6px]">
              Admin Panel
            </h1>
            <p className="text-[13px] text-white/50 font-['DM_Sans',sans-serif]">
              Manage students, faculty, courses, and departments. Changes take effect immediately.
            </p>
          </div>

          {/* Tabs + Search */}
          <div className="att-a2 flex flex-wrap items-center gap-[10px] mb-[18px]">
            <div className="flex gap-[4px] bg-white/5 border border-white/[0.08] rounded-full p-[3px]">
              {tabs.map(t => (
                <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
                  className={`px-[14px] py-[5px] border-none rounded-full text-[11px] font-bold cursor-pointer transition-all tracking-[0.2px] ${
                    tab === t.key
                      ? "bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white shadow-[0_2px_12px_rgba(94,174,255,0.4)]"
                      : "bg-transparent text-white/50"
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {tab === "students" && (
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, roll..."
                className="flex-1 min-w-[200px] px-4 py-[8px] rounded-full bg-white/[0.04] border border-white/10 text-white placeholder-white/25 text-[12px] font-['DM_Sans',sans-serif] focus:border-[#5EAEFF]/50 outline-none transition-all" />
            )}
            <button onClick={() => { setModal({ type: tab, mode: "create" }); setForm({}); }}
              className="px-[16px] py-[7px] border-none rounded-full bg-gradient-to-br from-[#34D399] to-[#5EAEFF] text-white text-[11px] font-bold cursor-pointer shadow-[0_4px_14px_rgba(52,211,153,.25)] hover:-translate-y-[1px] active:scale-[0.98] transition-all">
              + Add {tab.slice(0, -1)}
            </button>
          </div>

          {/* Table */}
          <div className="att-glass att-a3 p-[18px] overflow-x-auto">
            {loading ? (
              <div className="text-center text-white/40 py-8 animate-pulse">Loading...</div>
            ) : tab === "students" ? (
              <table className="w-full border-collapse">
                <thead><tr>
                  {["Name", "Email", "Roll No.", "Year", "Sem", "Dept", "Section", "Actions"].map(h => (
                    <th key={h} className="text-[9px] uppercase tracking-[0.8px] text-white/50 p-[8px_11px] text-left border-b border-white/[0.07] font-['DM_Sans',sans-serif]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="hover:[&_td]:bg-white/[0.02]">
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-bold">{s.user.name}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif] text-white/60">{s.user.email}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{s.rollNumber}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{s.year}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{s.semester}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{s.department.code}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{s.section.name}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04]">
                        <button onClick={() => handleDelete("students", s.id)} className="px-2 py-1 rounded-lg bg-[rgba(248,113,113,.1)] text-[#F87171] border border-[rgba(248,113,113,.2)] text-[9px] font-bold cursor-pointer hover:bg-[rgba(248,113,113,.2)] transition-all">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-white/30 text-[12px]">No students found</td></tr>}
                </tbody>
              </table>
            ) : tab === "faculty" ? (
              <table className="w-full border-collapse">
                <thead><tr>
                  {["Name", "Email", "Employee ID", "Designation", "Department", "Actions"].map(h => (
                    <th key={h} className="text-[9px] uppercase tracking-[0.8px] text-white/50 p-[8px_11px] text-left border-b border-white/[0.07] font-['DM_Sans',sans-serif]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {faculty.map(f => (
                    <tr key={f.id} className="hover:[&_td]:bg-white/[0.02]">
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-bold">{f.user.name}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif] text-white/60">{f.user.email}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{f.employeeId}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{f.designation}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{f.department.code}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04]">—</td>
                    </tr>
                  ))}
                  {faculty.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-white/30 text-[12px]">No faculty found</td></tr>}
                </tbody>
              </table>
            ) : tab === "courses" ? (
              <table className="w-full border-collapse">
                <thead><tr>
                  {["Code", "Name", "Credits", "Type", "Semester", "Faculty", "Students", "Dept"].map(h => (
                    <th key={h} className="text-[9px] uppercase tracking-[0.8px] text-white/50 p-[8px_11px] text-left border-b border-white/[0.07] font-['DM_Sans',sans-serif]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} className="hover:[&_td]:bg-white/[0.02]">
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-bold">{c.code}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c.name}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c.credits}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c.courseType}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c.semester}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c.assignments[0]?.faculty?.user?.name || "—"}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c._count.enrollments}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-['DM_Sans',sans-serif]">{c.department.code}</td>
                    </tr>
                  ))}
                  {courses.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-white/30 text-[12px]">No courses found</td></tr>}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[13px]">
                {departments.map(d => (
                  <div key={d.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[16px]">🏛️</span>
                      <div>
                        <div className="text-[13px] font-bold">{d.name}</div>
                        <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif]">{d.code}</div>
                      </div>
                    </div>
                    <div className="flex gap-[7px] flex-wrap">
                      <span className="px-2 py-[2px] rounded-full text-[9px] font-bold bg-[rgba(94,174,255,.1)] text-[#5EAEFF] border border-[rgba(94,174,255,.2)]">{d._count.students} students</span>
                      <span className="px-2 py-[2px] rounded-full text-[9px] font-bold bg-[rgba(167,139,250,.1)] text-[#A78BFA] border border-[rgba(167,139,250,.2)]">{d._count.faculty} faculty</span>
                      <span className="px-2 py-[2px] rounded-full text-[9px] font-bold bg-[rgba(52,211,153,.1)] text-[#34D399] border border-[rgba(52,211,153,.2)]">{d._count.courses} courses</span>
                    </div>
                    {d.sections.length > 0 && (
                      <div className="mt-2 text-[10px] text-white/40 font-['DM_Sans',sans-serif]">
                        Sections: {d.sections.map(s => s.name).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
                {departments.length === 0 && <div className="p-4 text-center text-white/30 text-[12px] col-span-2">No departments found</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/65 backdrop-blur-[8px]" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-[min(460px,92vw)] max-h-[85vh] overflow-y-auto p-[26px] rounded-[22px] bg-[rgba(8,12,30,.94)] border border-white/[0.12] backdrop-blur-[30px]" style={{ animation: "att-fup .35s both" }}>
            <button onClick={() => setModal(null)} className="float-right bg-white/[0.06] border border-white/10 text-white/50 w-7 h-7 rounded-full text-[14px] cursor-pointer hover:bg-white/[0.12] hover:text-white transition-all flex items-center justify-center">✕</button>

            <h3 className="text-[17px] font-extrabold tracking-[-0.3px] mb-1">
              {modal.type === "students" ? "🎓 Add Student" : modal.type === "faculty" ? "👨‍🏫 Add Faculty" : modal.type === "courses" ? "📚 Add Course" : "🏛️ Add Department"}
            </h3>
            <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-5">Fill in the details below. All fields marked are required.</p>

            <div className="space-y-3">
              {modal.type === "students" && (<>
                <div><label className={labelClass}>Full Name *</label><input className={inputClass} placeholder="Arjun Patel" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><label className={labelClass}>Email *</label><input className={inputClass} placeholder="arjun@apollo.edu" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><label className={labelClass}>Password</label><input className={inputClass} placeholder="student123 (default)" value={form.password || ""} onChange={e => setForm({...form, password: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Roll Number *</label><input className={inputClass} placeholder="CS21010" value={form.rollNumber || ""} onChange={e => setForm({...form, rollNumber: e.target.value})} /></div>
                  <div><label className={labelClass}>Reg Number</label><input className={inputClass} placeholder="REG21010" value={form.regNumber || ""} onChange={e => setForm({...form, regNumber: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelClass}>Year</label><input className={inputClass} type="number" placeholder="2" value={form.year || ""} onChange={e => setForm({...form, year: e.target.value})} /></div>
                  <div><label className={labelClass}>Semester</label><input className={inputClass} type="number" placeholder="4" value={form.semester || ""} onChange={e => setForm({...form, semester: e.target.value})} /></div>
                  <div><label className={labelClass}>Batch Year</label><input className={inputClass} type="number" placeholder="2024" value={form.batchYear || ""} onChange={e => setForm({...form, batchYear: e.target.value})} /></div>
                </div>
                <div><label className={labelClass}>Department *</label>
                  <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({...form, departmentId: e.target.value})}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Section *</label>
                  <select className={inputClass} value={form.sectionId || ""} onChange={e => setForm({...form, sectionId: e.target.value})}>
                    <option value="">Select section</option>
                    {departments.flatMap(d => d.sections).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </>)}

              {modal.type === "faculty" && (<>
                <div><label className={labelClass}>Full Name *</label><input className={inputClass} placeholder="Dr. Sharma" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><label className={labelClass}>Email *</label><input className={inputClass} placeholder="sharma@apollo.edu" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><label className={labelClass}>Password</label><input className={inputClass} placeholder="faculty123 (default)" value={form.password || ""} onChange={e => setForm({...form, password: e.target.value})} /></div>
                <div><label className={labelClass}>Employee ID *</label><input className={inputClass} placeholder="FAC005" value={form.employeeId || ""} onChange={e => setForm({...form, employeeId: e.target.value})} /></div>
                <div><label className={labelClass}>Designation</label><input className={inputClass} placeholder="Assistant Professor" value={form.designation || ""} onChange={e => setForm({...form, designation: e.target.value})} /></div>
                <div><label className={labelClass}>Department *</label>
                  <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({...form, departmentId: e.target.value})}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                  </select>
                </div>
              </>)}

              {modal.type === "courses" && (<>
                <div><label className={labelClass}>Course Code *</label><input className={inputClass} placeholder="CS501" value={form.code || ""} onChange={e => setForm({...form, code: e.target.value})} /></div>
                <div><label className={labelClass}>Course Name *</label><input className={inputClass} placeholder="Machine Learning" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelClass}>Credits</label><input className={inputClass} type="number" placeholder="3" value={form.credits || ""} onChange={e => setForm({...form, credits: e.target.value})} /></div>
                  <div><label className={labelClass}>Semester *</label><input className={inputClass} type="number" placeholder="4" value={form.semester || ""} onChange={e => setForm({...form, semester: e.target.value})} /></div>
                  <div><label className={labelClass}>Type</label>
                    <select className={inputClass} value={form.courseType || "LECTURE"} onChange={e => setForm({...form, courseType: e.target.value})}>
                      <option>LECTURE</option><option>LAB</option><option>TUTORIAL</option><option>PRACTICAL</option>
                    </select>
                  </div>
                </div>
                <div><label className={labelClass}>Department *</label>
                  <select className={inputClass} value={form.departmentId || ""} onChange={e => setForm({...form, departmentId: e.target.value})}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                  </select>
                </div>
              </>)}

              {modal.type === "departments" && (<>
                <div><label className={labelClass}>Department Code *</label><input className={inputClass} placeholder="CSE_AIDS" value={form.code || ""} onChange={e => setForm({...form, code: e.target.value})} /></div>
                <div><label className={labelClass}>Department Name *</label><input className={inputClass} placeholder="CSE (AI & Data Science)" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><label className={labelClass}>Description</label><input className={inputClass} placeholder="Optional description" value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div><label className={labelClass}>Sections (comma-separated)</label><input className={inputClass} placeholder="AIDS A, AIDS B" value={form.sectionNames || ""} onChange={e => setForm({...form, sectionNames: e.target.value})} /></div>
              </>)}
            </div>

            <button onClick={handleCreate} disabled={loading}
              className="w-full py-3 border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(94,174,255,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all disabled:opacity-50 mt-5">
              {loading ? "Creating..." : "✅ Create"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
