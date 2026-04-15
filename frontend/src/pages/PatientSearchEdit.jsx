import React, { useState } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function PatientSearchEdit() {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tokenQuery, setTokenQuery] = useState('');
    const [results, setResults] = useState([]);
    
    // Edit Modal State
    const [editing, setEditing] = useState(null);

    const handleSearch = async () => {
        try {
            let url = `http://localhost:5000/appointments?date=${date}`;
            if (tokenQuery) url += `&tokenQuery=${tokenQuery}`;
            const res = await axios.get(url);
            setResults(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this appointment? Tokens will be re-sequenced.")) return;
        try {
            await axios.delete(`http://localhost:5000/appointments/${id}`);
            alert('Appointment deleted and tokens resequenced.');
            handleSearch();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            // we split updates: appointments and patients
            await axios.put(`http://localhost:5000/appointments/${editing.id}`, editing);
            await axios.put(`http://localhost:5000/patients/${editing.patient_id}`, {
                name: editing.patient_name,
                gender: editing.gender,
                age: editing.age,
                phone: editing.patient_phone,
                // simplified, could include village etc
            });
            alert('Updated successfully');
            setEditing(null);
            handleSearch();
        } catch (error) {
            alert('Update failed');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Search & Edit Appointments</h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Token Number (Optional)</label>
                    <input type="number" value={tokenQuery} onChange={e => setTokenQuery(e.target.value)} className="border p-2 rounded-lg w-32" placeholder="e.g. 5" />
                </div>
                <button onClick={handleSearch} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2">
                    <Search size={20} /> <span>Search</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Token</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {results.map(r => (
                            <tr key={r.id}>
                                <td className="px-4 py-3 font-bold">{r.token_number}</td>
                                <td className="px-4 py-3">{r.patient_name} <span className="text-xs text-gray-500">({r.visit_type})</span></td>
                                <td className="px-4 py-3 text-gray-500">{r.patient_phone}</td>
                                <td className="px-4 py-3 flex space-x-2">
                                    <Link to={`/patient-report/${r.patient_id}`} className="p-2 bg-green-50 text-green-700 rounded hover:bg-green-100 font-medium text-sm flex items-center">Case Sheet</Link>
                                    <button onClick={() => setEditing(r)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit size={16} /></button>
                                    {user?.role === 'Admin' && (
                                        <button onClick={() => handleDelete(r.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {results.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-500">No data found</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-4">Edit Appointment #{editing.token_number}</h2>
                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Name</label>
                                    <input value={editing.patient_name} onChange={e => setEditing({...editing, patient_name: e.target.value})} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Phone</label>
                                    <input value={editing.patient_phone} onChange={e => setEditing({...editing, patient_phone: e.target.value})} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Comments</label>
                                    <input value={editing.comments || ''} onChange={e => setEditing({...editing, comments: e.target.value})} className="w-full border p-2 rounded" />
                                </div>
                                {/* Further dropdowns mapped from masters would be added here in full app */}
                            </div>
                            <div className="flex justify-end space-x-4 mt-6 border-t pt-4">
                                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-gray-500">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
