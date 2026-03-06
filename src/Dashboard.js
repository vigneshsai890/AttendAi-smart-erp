import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users, Activity, AlertTriangle, Download, Search, Filter, ClipboardList, CheckCircle, X } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ userRole, user }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'dashboard', 'manual-attendance'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Manual Attendance State
  const [students, setStudents] = useState([]);
  const [manualClassFilter, setManualClassFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState({});
  const [manualStatus, setManualStatus] = useState('');

  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DROWSY, LOW_ATTENTION

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For teachers, filter by their subject; for admin, show all
        let url = 'http://localhost:8080/api/attendance/session/1';
        if (userRole === 'TEACHER' && user?.subject) {
          url += `?subject=${encodeURIComponent(user.subject)}`;
        }
        const response = await axios.get(url);
        if (Array.isArray(response.data)) {
           setAttendanceData(response.data);
        } else {
           setAttendanceData([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAttendanceData([]);
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    
    // Also fetch student list for manual attendance
    fetchStudents();
    
    return () => clearInterval(interval);
  }, [userRole, user?.subject]);

  const fetchStudents = async () => {
      try {
          const res = await axios.get('http://localhost:8080/api/manage/students');
          setStudents(res.data);
      } catch(e) { console.error(e); }
  };

  const handleManualSubmit = async (status = 'PRESENT') => {
      setManualStatus("Submitting...");
      try {
          // Identify selected students
          const selectedIds = Object.keys(selectedStudents).filter(id => selectedStudents[id]);
          
          if (selectedIds.length === 0) {
              setManualStatus("No students selected.");
              return;
          }

          // Send request for each (or batch if API supported, doing loop for MVP)
          let count = 0;
          for (const studentId of selectedIds) {
              await axios.post('http://localhost:8080/api/attendance/manual-mark', {
                  studentId: parseInt(studentId),
                  sessionId: 1, // FORCE SESSION 1 TO MATCH DASHBOARD VIEW
                  subject: user?.subject || 'General',
                  status: status
              });
              count++;
          }
          setManualStatus(`Success! Marked ${count} students as ${status}.`);
          setSelectedStudents({}); // Reset
          
          // Refresh main data (with subject filter for teachers)
          let url = 'http://localhost:8080/api/attendance/session/1';
          if (userRole === 'TEACHER' && user?.subject) {
            url += `?subject=${encodeURIComponent(user.subject)}`;
          }
          const response = await axios.get(url);
          setAttendanceData(response.data);
          
      } catch (err) {
          setManualStatus("Error: " + err.message);
      }
  };
  
  const toggleStudentSelection = (id) => {
      setSelectedStudents(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  // ... (Rest of existing file handling methods)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadStatus('');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadStatus('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    setUploadStatus('Uploading and analyzing...');

    try {
      // Connect to Python AI Server directly (Port 5000)
      const response = await axios.post('http://localhost:5000/process-class-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus(`Analysis Complete: ${response.data.message || 'Done'}`);
      if (response.data.students) {
          setUploadResult(response.data.students);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error: Ensure Python AI Server (server.py) is running on port 5000.');
    }
  };

  // --- Export to CSV Feature ---
  const handleExportCSV = () => {
    if (attendanceData.length === 0) {
      alert("No data to export!");
      return;
    }
    
    // 1. Create CSV Header
    const csvRows = [];
    const headers = ["Student ID", "First Name", "Last Name", "Timestamp", "Attention Score", "Is Drowsy"];
    csvRows.push(headers.join(","));
    
    // 2. Add Data Rows
    attendanceData.forEach(record => {
      const row = [
        record.student.rollNumber,
        record.student.firstName,
        record.student.lastName,
        new Date(record.timestamp).toLocaleString(),
        record.attentionScore,
        record.isDrowsy ? "Yes" : "No"
      ];
      // Escape commas if any
      const escapedRow = row.map(str => `"${str}"`);
      csvRows.push(escapedRow.join(","));
    });
    
    // 3. Create Blob and Download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate stats
  const uniqueStudents = new Set(attendanceData.map(record => record.student.id)).size;
  const drowsyAlerts = attendanceData.filter(record => record.isDrowsy).length;
  const avgAttention = attendanceData.length > 0 
    ? (attendanceData.reduce((acc, curr) => acc + curr.attentionScore, 0) / attendanceData.length).toFixed(1)
    : 0;

  // Prepare chart data
  const chartData = {
    labels: attendanceData.map(record => new Date(record.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Attention Score',
        data: attendanceData.map(record => record.attentionScore),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  // Determine filtered data
  const filteredData = attendanceData.filter(record => {
    const matchesSearch = 
      record.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (statusFilter === 'DROWSY') return record.isDrowsy;
    if (statusFilter === 'LOW_ATTENTION') return record.attentionScore < 50;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800">
             {userRole === 'TEACHER' ? `Teacher Dashboard (${user?.subject || 'All'})` : 'College Administration Dashboard'}
           </h1>
           <div className="flex items-center gap-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase">
                {userRole} VIEW
              </span>
              <button 
                onClick={handleExportCSV} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded shadow transition text-sm"
              >
                <Download size={18} />
                Export CSV Report
              </button>
           </div>
        </div>

        {/* TABS for TEACHER */}
        {userRole === 'TEACHER' && (
            <div className="flex space-x-4 mb-6 border-b pb-2">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 font-semibold transition border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Activity size={18} className="inline mr-2"/>
                    AI Monitoring
                </button>
                <button 
                    onClick={() => setActiveTab('manual-attendance')}
                    className={`px-4 py-2 font-semibold transition border-b-2 ${activeTab === 'manual-attendance' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <ClipboardList size={18} className="inline mr-2"/>
                    Manual Attendance
                </button>
            </div>
        )}
        
        {/* MANUAL ATTENDANCE VIEW */}
        {activeTab === 'manual-attendance' && (
            <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-green-500">
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <CheckCircle className="text-green-600"/> Mark Subject Attendance ({user?.subject || 'General'})
                        </h2>
                        {user?.assignedClasses && (
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-blue-800 uppercase mb-1">My Classes</p>
                                <div className="flex gap-2">
                                    {user.assignedClasses.split(',').map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => setManualClassFilter(cls.trim())}
                                            className={`px-3 py-1 text-sm rounded ${
                                                manualClassFilter === cls.trim() 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                                            }`}
                                        >
                                            {cls.trim()}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => setManualClassFilter('')}
                                        className="text-xs text-gray-400 hover:text-gray-600 underline self-center ml-1"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                
                    <div className="flex gap-4 items-center mb-6 bg-gray-50 p-3 rounded">
                        <span className="font-medium text-gray-700">Filter Students:</span>
                        <input 
                            type="text" 
                            placeholder={user?.assignedClasses ? "Select a class above..." : "Filter by Class (e.g. CSA)"}
                            className="border p-2 rounded w-64 focus:ring-2 focus:ring-green-500 outline-none bg-white"
                            value={manualClassFilter} onChange={e => setManualClassFilter(e.target.value)}
                        />
                        <span className="text-sm text-gray-500 font-mono bg-white px-2 py-1 rounded border">
                            {students.filter(s => {
                                // First, filter by assigned classes if any (Security check)
                                if (user?.assignedClasses) {
                                    const allowed = user.assignedClasses.split(',').map(c => c.trim().toLowerCase());
                                    if (!s.className || !allowed.includes(s.className.toLowerCase())) return false;
                                }
                                // Then apply manual filter
                                return !manualClassFilter || (s.className && s.className.toLowerCase().includes(manualClassFilter.toLowerCase()));
                            }).length} students found
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto mb-6 p-1">
                    {students.filter(s => {
                         // Copy same logic
                         if (user?.assignedClasses) {
                            const allowed = user.assignedClasses.split(',').map(c => c.trim().toLowerCase());
                            if (!s.className || !allowed.includes(s.className.toLowerCase())) return false;
                         }
                         return !manualClassFilter || (s.className && s.className.toLowerCase().includes(manualClassFilter.toLowerCase()));
                    })
                    .map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => toggleStudentSelection(s.id)}
                            className={`p-4 border rounded cursor-pointer transition flex justify-between items-center select-none
                                ${selectedStudents[s.id] ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-white hover:bg-gray-50'}
                            `}
                        >
                            <div>
                                <p className="font-bold text-gray-800">{s.rollNumber}</p>
                                <p className="text-sm text-gray-600">{s.firstName} {s.lastName}</p>
                                <p className="text-xs text-gray-400 uppercase font-bold mt-1">{s.className || 'NO CLASS'}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${selectedStudents[s.id] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                {selectedStudents[s.id] && <CheckCircle size={14} className="text-white"/>}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="pt-4 border-t flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                        {Object.values(selectedStudents).filter(Boolean).length} students selected
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleManualSubmit('PRESENT')}
                            disabled={Object.values(selectedStudents).filter(Boolean).length === 0}
                            className="bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition shadow flex items-center gap-2"
                        >
                            <CheckCircle size={20}/> Mark Present
                        </button>
                        <button 
                            onClick={() => handleManualSubmit('ABSENT')}
                            disabled={Object.values(selectedStudents).filter(Boolean).length === 0}
                            className="bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition shadow flex items-center gap-2"
                        >
                            <X size={20}/> Mark Absent
                        </button>
                    </div>
                </div>
                {manualStatus && (
                    <div className={`mt-4 p-3 rounded text-center font-medium ${manualStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {manualStatus}
                    </div>
                )}
            </div>
        )}
        
        {/* TEACHER CLASS OVERVIEW */}
        {activeTab === 'dashboard' && userRole === 'TEACHER' && user?.assignedClasses && (
            <div className="bg-white rounded-lg shadow p-6 mb-8 border-t-4 border-indigo-500">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="text-indigo-600"/> My Class Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {user.assignedClasses.split(',').map((cls) => {
                        const className = cls.trim();
                        const studentCount = students.filter(s => s.className && s.className.toLowerCase() === className.toLowerCase()).length;
                        return (
                            <div key={className} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 hover:shadow-md transition">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold text-indigo-900">{className}</h3>
                                    <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200">
                                        {studentCount} Students
                                    </span>
                                </div>
                                <div className="mt-4 pt-3 border-t border-indigo-200">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Live Status</h4>
                                    <div className="flex gap-2 text-sm">
                                        <div className="flex-1 bg-white p-2 rounded border border-green-200 text-center">
                                            <span className="block text-green-700 font-bold text-lg">
                                                {attendanceData.filter(r => r.student?.className?.toLowerCase() === className.toLowerCase()).length}
                                            </span>
                                            <span className="text-xs text-green-600">Present</span>
                                        </div>
                                        <div className="flex-1 bg-white p-2 rounded border border-red-200 text-center">
                                            <span className="block text-red-700 font-bold text-lg">
                                                {studentCount - attendanceData.filter(r => r.student?.className?.toLowerCase() === className.toLowerCase()).length}
                                            </span>
                                            <span className="text-xs text-red-600">Absent</span>
                                        </div>
                                    </div>
                                    
                                    {/* Detailed Toggle */}
                                    <details className="mt-2 text-xs">
                                        <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-semibold select-none list-none flex items-center gap-1 justify-center mt-2 border rounded py-1 bg-white">
                                            <span>Show Student List</span> <Users size={10}/>
                                        </summary>
                                        <div className="mt-2 text-left grid grid-cols-2 gap-2 bg-white p-2 rounded border max-h-40 overflow-y-auto w-100">
                                            <div className="border-r pr-2">
                                                <p className="font-bold text-green-700 mb-1 border-b text-center sticky top-0 bg-white">Present</p>
                                                {attendanceData
                                                    .filter(r => r.student?.className?.toLowerCase() === className.toLowerCase())
                                                    .map(r => (
                                                        <div key={r.student.id} className="truncate py-0.5" title={`${r.student.firstName} ${r.student.lastName}`}>
                                                            ✅ {r.student.rollNumber} - {r.student.firstName}
                                                        </div>
                                                    ))
                                                }
                                                {attendanceData.filter(r => r.student?.className?.toLowerCase() === className.toLowerCase()).length === 0 && <p className="text-gray-400 italic">None</p>}
                                            </div>
                                            <div className="pl-1">
                                                <p className="font-bold text-red-700 mb-1 border-b text-center sticky top-0 bg-white">Absent</p>
                                                {students
                                                    .filter(s => s.className?.toLowerCase() === className.toLowerCase() && !attendanceData.some(r => r.student.id === s.id))
                                                    .map(s => (
                                                        <div key={s.id} className="truncate py-0.5" title={`${s.firstName} ${s.lastName}`}>
                                                            ❌ {s.rollNumber} - {s.firstName}
                                                        </div>
                                                    ))
                                                }
                                                {students.filter(s => s.className?.toLowerCase() === className.toLowerCase() && !attendanceData.some(r => r.student.id === s.id)).length === 0 && <p className="text-gray-400 italic">None</p>}
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                <button 
                                    onClick={() => {
                                        setActiveTab('manual-attendance');

                                        setManualClassFilter(className);
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 mt-2"
                                >
                                    View Class <Activity size={12}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        
        {/* Class Photo Upload Section - Visible to ALL (Admin often needs to do everything) */}
        {activeTab === 'dashboard' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📸 Upload Class Photo</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <button 
              onClick={handleUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition"
            >
              Analyze & Mark Attendance
            </button>
          </div>
          {uploadStatus && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700 font-medium border border-gray-200">
              {uploadStatus}
            </div>
          )}
          {uploadResult && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-600 mb-2">Identified Students:</h3>
              <div className="flex flex-wrap gap-2">
                {uploadResult.map((student, idx) => (
                  <span key={idx} className={`px-3 py-1 rounded text-sm border ${
                    student.status === 'Success' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    {student.id} ({Math.round((1 - student.confidence) * 100)}% match)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Stats Cards - Only in Dashboard View */}
        {activeTab === 'dashboard' && (<React.Fragment>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg Attention Score</p>
              <p className="text-2xl font-bold text-gray-800">{avgAttention}%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Drowsiness Alerts</p>
              <p className="text-2xl font-bold text-gray-800">{drowsyAlerts}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Attention Trend</h2>
            <div className="h-64">
              <Line data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Recent Activity List with Search & Filter */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
              <span>Live Class Activity</span>
              <span className="text-sm font-normal text-gray-500">{filteredData.length} records</span>
            </h2>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search student or Roll No..." 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-auto">
                <Filter size={18} className="absolute left-3 top-3 text-gray-400" />
                <select 
                  className="w-full md:w-48 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Events</option>
                  <option value="DROWSY">💤 Drowsy Only</option>
                  <option value="LOW_ATTENTION">⚠️ Low Attention (&lt;50%)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto h-64 pr-2">
              {filteredData.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No matching records found</div>
              ) : (
                filteredData.slice().reverse().map((record, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition">
                    <div>
                      <p className="font-medium text-gray-800">
                        {record.student.firstName} {record.student.lastName}
                        <span className="text-gray-400 text-xs ml-2">({record.student.rollNumber})</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium inline-block min-w-[3rem] text-center ${
                        record.attentionScore > 80 ? 'bg-green-100 text-green-800' : 
                        record.attentionScore > 60 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.attentionScore}%
                      </span>
                      {record.isDrowsy && (
                        <span className="ml-2 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                          💤 Drowsy
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </React.Fragment>)}
      </div>
    </div>
  );
};

export default Dashboard;
