import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, Activity, IndianRupee, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        patientsToday: 0,
        revenueToday: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const res = await axios.get(`http://localhost:5000/reports/daily?date=${today}`);

                const appointments = res.data;
                const revenue = appointments.reduce((sum, appt) => sum + (Number(appt.consultation_fee) || 0), 0);

                setStats({
                    patientsToday: appointments.length,
                    revenueToday: revenue,
                });
            } catch (error) {
                console.error("Error fetching stats", error);
            }
            setLoading(false);
        };
        fetchDashboardStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <div className="text-gray-500 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="z-10">
                    <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h2>
                    <p className="text-primary-100 text-lg">You are logged in securely as <span className="font-bold text-white underline">{user?.role}</span>.</p>
                </div>
                <div className="hidden md:block z-10">
                    <Clock size={64} className="text-primary-300 opacity-50" />
                </div>
                {/* Decorative background circle */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500 rounded-full opacity-20 -mr-20 -mt-20 blur-3xl text-none"></div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => navigate('/register')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer transform hover:-translate-y-1">
                        <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                            <Users size={28} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-800">Register Patient</div>
                            <div className="text-sm text-gray-500">Create new tokens</div>
                        </div>
                    </div>

                    {user?.role !== 'User1' && (
                        <div onClick={() => navigate('/investigations')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-lg hover:border-green-200 transition-all cursor-pointer transform hover:-translate-y-1">
                            <div className="p-4 bg-green-100 rounded-full text-green-600">
                                <Activity size={28} />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-gray-800">Record Vitals</div>
                                <div className="text-sm text-gray-500">Log patient metrics</div>
                            </div>
                        </div>
                    )}

                    <div onClick={() => navigate('/reports')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer transform hover:-translate-y-1">
                        <div className="p-4 bg-purple-100 rounded-full text-purple-600">
                            <FileText size={28} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-800">Daily Reports</div>
                            <div className="text-sm text-gray-500">View performance</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Statistics */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Patients Today</p>
                            <h3 className="text-5xl font-black text-gray-800 mt-3">
                                {loading ? '...' : stats.patientsToday}
                            </h3>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-full text-blue-500">
                            <Users size={36} />
                        </div>
                    </div>

                    {/* <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Revenue Collected</p>
                            <h3 className="text-5xl font-black text-gray-800 mt-3 flex items-center">
                                <IndianRupee size={40} className="mr-1 inline text-gray-800" strokeWidth={3} />
                                {loading ? '...' : stats.revenueToday}
                            </h3>
                        </div>
                        <div className="bg-green-50 p-6 rounded-full text-green-500">
                            <Activity size={36} />
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
