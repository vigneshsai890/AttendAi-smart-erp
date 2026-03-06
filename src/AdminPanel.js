import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserPlus, Upload, Users, RefreshCw, Edit, Trash2, X, Check, GraduationCap, School } from 'lucide-react';

const AdminPanel = ({ readOnly = false }) => {
    // Tab State
    const [activeTab, setActiveTab] = useState('students'); // 'students' or 'teachers'

    // Form State (Shared or separate - keeping separate for clarity)
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [status, setStatus] = useState('');

    // Student State
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


    // Teacher State
    const [teachers, setTeachers] = useState([]);
    const [teacherUsername, setTeacherUsername] = useState('');
    const [teacherPassword, setTeacherPassword] = useState('');
    const [teacherSubject, setTeacherSubject] = useState('');
    const [assignedClasses, setAssignedClasses] = useState('');

    // Fetch data on load
    useEffect(() => {
        fetchStudents();
        fetchTeachers();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/manage/students');
            setStudents(response.data);
        } catch (error) { console.error("Error fetching students:", error); }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/manage/teachers');
            setTeachers(response.data);
        } catch (error) { console.error("Error fetching teachers:", error); }
    };

    const resetForm = () => {
        setEditMode(false);
        setCurrentId(null);
        setStatus('');
        // Reset Student Fields
        setRollNo(''); setFirstName(''); setLastName(''); setEmail(''); setClassName(''); setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setStudentUsername(''); setStudentPassword('');
        // Reset Teacher Fields
        setTeacherUsername(''); setTeacherPassword(''); setTeacherSubject(''); setAssignedClasses('');
    };

    // --- STUDENT HANDLERS ---
    const handleStudentEdit = (student) => {
        setEditMode(true);
        setCurrentId(student.id);
        setRollNo(student.rollNumber);
        setFirstName(student.firstName);
        setLastName(student.lastName || '');
        setEmail(student.email || '');
        setClassName(student.className || '');
        setStudentUsername(''); // Typically don't show username/password on edit unless requested (separate API needed to fetch user details)
        setStudentPassword('');
        setStatus('');
        window.scrollTo(0,0);
    };

    const handleStudentDelete = async (id, name) => {
        if (window.confirm(`Delete student ${name}?`)) {
            try {
                await axios.delete(`http://localhost:8080/api/manage/delete-student/${id}`);
                setStudents(students.filter(s => s.id !== id));
                setStatus(`Deleted ${name}.`);
            } catch (err) { setStatus('Error: ' + err.message); }
        }
    };

    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setStatus('Processing...');
        try {
            if (editMode) {
                await axios.put(`http://localhost:8080/api/manage/update-student/${currentId}`, {
                    rollNumber: rollNo, firstName, lastName, email, className
                    // Not updating username/password here for simplicity, or add separate fields
                });
                setStatus(`Updated ${firstName}.`);
            } else {
                const res = await axios.post('http://localhost:8080/api/manage/add-student', {
                    rollNumber: rollNo, firstName, lastName, email, className,
                    faceEncodingId: `face_${rollNo}`,
                    username: studentUsername,
                    password: studentPassword
                });
                if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    await axios.post(`http://localhost:8080/api/manage/upload-photo/${res.data.id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
                setStatus(`Added ${firstName}.`);
            }
            resetForm();
            fetchStudents();
        } catch (err) { setStatus('Error: ' + (err.response?.data?.message || err.message)); }
    };

    // --- TEACHER HANDLERS ---
    const handleTeacherEdit = (teacher) => {
        setEditMode(true);
        setCurrentId(teacher.id);
        setTeacherUsername(teacher.username);
        setTeacherSubject(teacher.subject || '');
        setAssignedClasses(teacher.assignedClasses || '');
        setTeacherPassword(''); // Do not show old password
        setStatus('');
        window.scrollTo(0,0);
    };

    const handleTeacherDelete = async (id, name) => {
        if (window.confirm(`Delete teacher ${name}?`)) {
            try {
                await axios.delete(`http://localhost:8080/api/manage/delete-teacher/${id}`);
                setTeachers(teachers.filter(t => t.id !== id));
                setStatus(`Deleted ${name}.`);
            } catch (err) { setStatus('Error: ' + err.message); }
        }
    };

    const handleTeacherSubmit = async (e) => {
        e.preventDefault();
        setStatus('Processing...');
        try {
            const payload = {
                username: teacherUsername,
                password: teacherPassword, // Only sent if provided
                subject: teacherSubject,
                assignedClasses: assignedClasses
            };

            if (editMode) {
                await axios.put(`http://localhost:8080/api/manage/update-teacher/${currentId}`, payload);
                setStatus(`Updated Teacher ${teacherUsername}.`);
            } else {
                if (!teacherPassword) { setStatus('Password is required for new teachers'); return; }
                await axios.post('http://localhost:8080/api/manage/add-teacher', payload);
                setStatus(`Registered Teacher ${teacherUsername}.`);
            }
            resetForm();
            fetchTeachers();
        } catch (err) { setStatus('Error: ' + (err.response?.data?.message || err.message)); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4">
            {/* TABS */}
            <div className="flex space-x-4 border-b pb-2 mb-6">
                <button 
                    onClick={() => { setActiveTab('students'); resetForm(); }}
                    className={`px-6 py-3 font-semibold text-lg flex items-center gap-2 transition border-b-2
                        ${activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <GraduationCap size={24}/> Manage Students
                </button>
                <button 
                    onClick={() => { setActiveTab('teachers'); resetForm(); }}
                    className={`px-6 py-3 font-semibold text-lg flex items-center gap-2 transition border-b-2
                        ${activeTab === 'teachers' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <School size={24}/> Manage Teachers
                </button>
            </div>

            {/* STATUS MESSAGE */}
            {status && (
                <div className={`p-3 rounded text-center font-medium ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {status}
                </div>
            )}

            {/* ---------------- STUDENT SECTION ---------------- */}
            {activeTab === 'students' && (
                <>
                    {/* Student Form */}
                    {!readOnly && (
                        <div className={`p-6 rounded-lg shadow-md border-t-4 transition-colors ${editMode ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-blue-500'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    {editMode ? <Edit className="text-yellow-600"/> : <UserPlus className="text-blue-600"/>}
                                    {editMode ? 'Edit Student' : 'Register Student'}
                                </h2>
                                {editMode && <button onClick={resetForm} className="text-sm text-gray-500 flex items-center gap-1"><X size={16}/> Cancel</button>}
                            </div>
                            <form onSubmit={handleStudentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="border p-2 rounded" placeholder="Roll Number" value={rollNo} onChange={e=>setRollNo(e.target.value)} required/>
                                <input className="border p-2 rounded" placeholder="First Name" value={firstName} onChange={e=>setFirstName(e.target.value)} required/>
                                <input className="border p-2 rounded" placeholder="Last Name" value={lastName} onChange={e=>setLastName(e.target.value)}/>
                                <input className="border p-2 rounded" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
                                <input className="border p-2 rounded" placeholder="Class Name (e.g. CSA)" value={className} onChange={e=>setClassName(e.target.value)}/>
                                
                                {!editMode && (
                                    <>
                                        <input className="border p-2 rounded" placeholder="Set Username (Default: RollNo)" value={studentUsername} onChange={e=>setStudentUsername(e.target.value)} />
                                        <input className="border p-2 rounded" placeholder="Set Password (Default: password123)" type="password" value={studentPassword} onChange={e=>setStudentPassword(e.target.value)} />
                                    </>
                                )}

                                {!editMode && (
                                    <div className="flex items-center gap-2 border p-2 rounded bg-gray-50 md:col-span-2">
                                        <Upload size={16} className="text-gray-500"/>
                                        <input type="file" ref={fileInputRef} className="text-sm" onChange={e=>setFile(e.target.files[0])} accept="image/*"/>
                                    </div>
                                )}
                                <button type="submit" className={`md:col-span-2 py-2 rounded text-white font-bold flex justify-center items-center gap-2 ${editMode ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                                    {editMode ? <><Check size={18}/> Update Student</> : <><UserPlus size={18}/> Register Student</>}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Student List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="text-blue-600"/> Student List ({students.length})
                            </h3>
                            <button onClick={fetchStudents}><RefreshCw size={20}/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3">Roll No</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Class</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {students.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{s.rollNumber}</td>
                                            <td className="p-3">{s.firstName} {s.lastName}</td>
                                            <td className="p-3">{s.className || '-'}</td>
                                            <td className="p-3 flex gap-2">
                                                <button onClick={() => handleStudentEdit(s)} className="text-blue-600"><Edit size={16}/></button>
                                                <button onClick={() => handleStudentDelete(s.id, s.firstName)} className="text-red-600"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ---------------- TEACHER SECTION ---------------- */}
            {activeTab === 'teachers' && (
                <>
                    {/* Teacher Form */}
                    {!readOnly && (
                        <div className={`p-6 rounded-lg shadow-md border-t-4 transition-colors ${editMode ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-green-500'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    {editMode ? <Edit className="text-yellow-600"/> : <UserPlus className="text-green-600"/>}
                                    {editMode ? 'Edit Teacher' : 'Register Teacher'}
                                </h2>
                                {editMode && <button onClick={resetForm} className="text-sm text-gray-500 flex items-center gap-1"><X size={16}/> Cancel</button>}
                            </div>
                            <form onSubmit={handleTeacherSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Username</label>
                                    <input className="w-full border p-2 rounded" value={teacherUsername} onChange={e=>setTeacherUsername(e.target.value)} required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password {editMode && '(Leave blank to keep current)'}</label>
                                    <input className="w-full border p-2 rounded" type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} required={!editMode}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Subject (e.g. Maths)</label>
                                    <input className="w-full border p-2 rounded" value={teacherSubject} onChange={e=>setTeacherSubject(e.target.value)} required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assigned Classes (Comma separated, e.g. CSA, CSB)</label>
                                    <input className="w-full border p-2 rounded" value={assignedClasses} onChange={e=>setAssignedClasses(e.target.value)} placeholder="CSA, CSB"/>
                                </div>
                                <button type="submit" className={`md:col-span-2 py-2 rounded text-white font-bold flex justify-center items-center gap-2 ${editMode ? 'bg-yellow-500' : 'bg-green-600'}`}>
                                    {editMode ? <><Check size={18}/> Update Teacher</> : <><UserPlus size={18}/> Register Teacher</>}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Teacher List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="text-green-600"/> Teacher List ({teachers.length})
                            </h3>
                            <button onClick={fetchTeachers}><RefreshCw size={20}/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3">Username</th>
                                        <th className="p-3">Subject</th>
                                        <th className="p-3">Assigned Classes</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {teachers.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{t.username}</td>
                                            <td className="p-3">{t.subject || '-'}</td>
                                            <td className="p-3">
                                                {t.assignedClasses ? t.assignedClasses.split(',').map(c => 
                                                    <span key={c} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">{c.trim()}</span>
                                                ) : <span className="text-gray-400">All</span>}
                                            </td>
                                            <td className="p-3 flex gap-2">
                                                <button onClick={() => handleTeacherEdit(t)} className="text-blue-600"><Edit size={16}/></button>
                                                <button onClick={() => handleTeacherDelete(t.id, t.username)} className="text-red-600"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminPanel;
