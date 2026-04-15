import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash, Edit } from 'lucide-react';

const TABS = ['Doctors', 'Referrals', 'Batches', 'Payment Modes', 'Users'];

export default function Masters() {
    const [activeTab, setActiveTab] = useState('Doctors');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let endpoint = activeTab.toLowerCase().replace(' ', '-');
            const res = await axios.get(`http://localhost:5000/masters/${endpoint}`);
            setData(res.data);
            setFormData({});
        } catch (error) {
            console.error('Error fetching data', error);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = activeTab.toLowerCase().replace(' ', '-');
            await axios.post(`http://localhost:5000/masters/${endpoint}`, formData);
            fetchData();
        } catch (error) {
            alert('Error saving data');
        }
    };

    const renderForm = () => {
        if (activeTab === 'Doctors') {
            return (
                <>
                    <input className="border p-2 rounded" placeholder="Doctor Name" name="name" onChange={handleInputChange} required />
                    <input className="border p-2 rounded" placeholder="Details/Specialty" name="details" onChange={handleInputChange} />
                </>
            );
        }
        if (activeTab === 'Referrals') {
            return (
                <>
                    <select className="border p-2 rounded" name="type" onChange={handleInputChange} required defaultValue="">
                        <option value="" disabled>Select Type</option>
                        <option value="Doctor">Doctor</option>
                        <option value="RMP">RMP</option>
                        <option value="PRO">PRO</option>
                        <option value="Other">Other</option>
                        <option value="Self">Self</option>
                    </select>
                    <input className="border p-2 rounded" placeholder="Referral Name" name="name" onChange={handleInputChange} required />
                </>
            );
        }
        if (activeTab === 'Users') {
            return (
                <>
                    <input className="border p-2 rounded" placeholder="Username" name="username" onChange={handleInputChange} required />
                    <input className="border p-2 rounded" type="password" placeholder="Password" name="password" onChange={handleInputChange} required />
                    <select className="border p-2 rounded" name="role" onChange={handleInputChange} required defaultValue="">
                        <option value="" disabled>Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="User1">User1</option>
                        <option value="User2/User3">User2/User3</option>
                    </select>
                </>
            );
        }
        // Batches and Payment Modes
        return (
            <input className="border p-2 rounded" placeholder="Name" name="name" onChange={handleInputChange} required />
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Masters Configuration</h1>

            <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="flex gap-4 items-end mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {renderForm()}
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition">
                        Add New
                    </button>
                </form>

                {loading ? <div className="text-center py-4">Loading...</div> : (
                    <div className="overflow-hidden border border-gray-200 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    {activeTab === 'Doctors' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>}
                                    {activeTab === 'Doctors' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>}
                                    
                                    {activeTab === 'Referrals' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>}
                                    {activeTab === 'Referrals' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>}
                                    
                                    {activeTab === 'Users' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>}
                                    {activeTab === 'Users' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>}

                                    {['Batches', 'Payment Modes'].includes(activeTab) && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.id}</td>
                                        {activeTab === 'Doctors' && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>}
                                        {activeTab === 'Doctors' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.details}</td>}
                                        
                                        {activeTab === 'Referrals' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.type}</td>}
                                        {activeTab === 'Referrals' && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>}
                                        
                                        {activeTab === 'Users' && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.username}</td>}
                                        {activeTab === 'Users' && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.role}</td>}

                                        {['Batches', 'Payment Modes'].includes(activeTab) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length === 0 && <div className="text-center py-6 text-gray-500">No records found.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
