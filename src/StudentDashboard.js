import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Calendar, User, Clock, AlertTriangle } from 'lucide-react';

const StudentDashboard = ({ user }) => {
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState({ present: 0, avgAttention: 0 });

    useEffect(() => {
        // Fetch only this student's attendance
        const fetchAttendance = async () => {
            if (!user.studentId && user.studentProfile) {
                user.studentId = user.studentProfile.id;
            }
            if (!user.studentId) return;

            try {
                const response = await axios.get(`http://localhost:8080/api/attendance/student/${user.studentId}`);
                const data = response.data;
                setAttendance(data);

                // Calc Stats
                const presentCount = data.length; // Assuming each record is a 'present' mark
                const avgAtt = data.length ? (data.reduce((a, b) => a + b.attentionScore, 0) / data.length).toFixed(1) : 0;
                setStats({ present: presentCount, avgAttention: avgAtt });

            } catch (error) {
                console.error("Error fetching student data", error);
            }
        };
        fetchAttendance();
    }, [user]);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header / Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                        <User size={48} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.studentProfile?.firstName || 'Student'}!</h1>
                        <p className="text-gray-500">Roll Number: {user.username}</p>
                    </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex space-x-6 text-center">
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold">Classes Attended</p>
                        <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold">Avg Attention</p>
                        <p className={`text-3xl font-bold ${stats.avgAttention > 75 ? 'text-blue-600' : 'text-yellow-600'}`}>
                            {stats.avgAttention}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Simulated Scan Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm flex items-start">
                <div className="mr-4 text-blue-500 mt-1"><Camera /></div>
                <div>
                    <h3 className="font-bold text-blue-800">How to Mark Attendance?</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Attendance is marked automatically using the <b>Classroom AI Camera</b>. 
                        Simply look at the camera when you enter the class. Your presence and attention score will appear below automatically.
                    </p>
                </div>
            </div>

            {/* Attendance History */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Calendar className="text-gray-500" size={20} />
                    <h3 className="text-lg font-semibold text-gray-700">Recent Attendance Logs</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period / Subject</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Attention</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Alerts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {attendance.length > 0 ? (
                                attendance.slice().reverse().map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-gray-400" />
                                                {new Date(record.timestamp).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-semibold">
                                                {record.subject || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                {new Date(record.timestamp).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                                record.status === 'PRESENT' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${record.attentionScore > 75 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                                                        style={{ width: `${record.attentionScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium">{record.attentionScore}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.isDrowsy && (
                                                <span className="flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-100 px-2 py-1 rounded w-fit">
                                                    <AlertTriangle size={12} /> Drowsy
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No attendance records found yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
