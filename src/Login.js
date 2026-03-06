import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, LogIn } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                username,
                password
            });
            // Pass the user object back to App.js
            onLogin(response.data);
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <LogIn size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Smart Class Login</h2>
                
                {error && <p className="mb-4 text-center text-red-600 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Enter your ID"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="******"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
                        Login
                    </button>
                    
                    <div className="text-center text-xs text-gray-500 mt-4">
                        <p>Demo Login:</p>
                        <p>Teacher: <b>admin</b> / <b>admin123</b></p>
                        <p>Student: <b>101</b> / <b>1234</b></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
