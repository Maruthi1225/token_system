import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
    Users, Plus, Search, Bed, LayoutDashboard, X, Activity, IndianRupee, Smartphone, CreditCard, CheckCircle, Loader2 
} from 'lucide-react';

export default function Inpatients() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('admissions'); // admissions | wards
    const [admissions, setAdmissions] = useState([]);
    const [wards, setWards] = useState([]);
    
    // Modal states
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
    const [isWardModalOpen, setIsWardModalOpen] = useState(false);
    const [isBedModalOpen, setIsBedModalOpen] = useState(false);
    const [selectedWardForBed, setSelectedWardForBed] = useState(null);

    // Search and form states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [admitForm, setAdmitForm] = useState({ bed_id: '', advance_payment: 0, payment_mode_id: '' });
    const [wardForm, setWardForm] = useState({ name: '', type: 'General', cost_per_day: 0, number_of_beds: 0 });
    const [bedForm, setBedForm] = useState({ count: 1 });
    const [paymentModes, setPaymentModes] = useState([]);

    // Payment Gateway States
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        fetchAdmissions();
        fetchWards();
        fetchPaymentModes();
    }, []);

    const fetchPaymentModes = async () => {
        try {
            const res = await axios.get('http://localhost:5000/masters/payment-modes');
            setPaymentModes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAdmissions = async () => {
        try {
            const res = await fetch('http://localhost:5000/inpatient/admissions');
            const data = await res.json();
            setAdmissions(data);
        } catch (err) {
            console.error('Error fetching admissions', err);
        }
    };

    const fetchWards = async () => {
        try {
            const res = await fetch('http://localhost:5000/inpatient/wards');
            const data = await res.json();
            setWards(data);
        } catch (err) {
            console.error('Error fetching wards', err);
        }
    };

    // Patient Search for Admission
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`http://localhost:5000/patients?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Error searching patients:', error);
        }
    };

    const handleAdmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient || !admitForm.bed_id) return alert('Select patient and bed');
        
        const advance = parseFloat(admitForm.advance_payment || 0);
        if (advance > 0 && !admitForm.payment_mode_id) return alert('Select payment mode for advance');

        const selectedMode = paymentModes.find(pm => pm.id === admitForm.payment_mode_id);

        if (advance > 0 && selectedMode && selectedMode.name.toLowerCase() !== 'cash') {
            setIsAdmitModalOpen(false);
            setShowPaymentGateway(true);
            setPaymentProcessing(false);
            setPaymentSuccess(false);
        } else {
            completeAdmit();
        }
    };

    const simulatePayment = () => {
        setPaymentProcessing(true);
        setTimeout(() => {
            setPaymentProcessing(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                completeAdmit();
            }, 1000);
        }, 2000);
    };

    const completeAdmit = async () => {
        try {
            const res = await fetch('http://localhost:5000/inpatient/admissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: selectedPatient.id,
                    bed_id: admitForm.bed_id,
                    advance_payment: admitForm.advance_payment,
                    // Sending payment_mode_id if needed by backend later
                    payment_mode_id: admitForm.payment_mode_id || null
                })
            });
            if (res.ok) {
                setShowPaymentGateway(false);
                setIsAdmitModalOpen(false);
                setSelectedPatient(null);
                setSearchQuery('');
                setSearchResults([]);
                setAdmitForm({ bed_id: '', advance_payment: 0, payment_mode_id: '' });
                fetchAdmissions();
                fetchWards(); // Update bed availability
                alert('Patient admitted successfully!');
            } else {
                const data = await res.json();
                alert(data.error);
                setShowPaymentGateway(false);
            }
        } catch (err) {
            console.error(err);
            setShowPaymentGateway(false);
        }
    };

    const handleAddWard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/inpatient/wards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wardForm)
            });
            if (res.ok) {
                setIsWardModalOpen(false);
                setWardForm({ name: '', type: 'General', cost_per_day: 0, number_of_beds: 0 });
                fetchWards();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteWard = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ward?')) return;
        try {
            const res = await fetch(`http://localhost:5000/inpatient/wards/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchWards();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddBed = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/inpatient/wards/${selectedWardForBed}/bulk-beds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: bedForm.count })
            });
            if (res.ok) {
                setIsBedModalOpen(false);
                setBedForm({ count: 1 });
                fetchWards();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteBed = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bed?')) return;
        try {
            const res = await fetch(`http://localhost:5000/inpatient/beds/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchWards();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getAvailableBeds = () => {
        return wards.flatMap(w => w.beds.filter(b => b.status === 'Available').map(b => ({...b, ward_name: w.name, cost: w.cost_per_day})));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Inpatient Management</h1>
                <div className="space-x-3">
                    <button 
                        onClick={() => setIsAdmitModalOpen(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Admit Patient
                    </button>
                </div>
            </div>

            <div className="flex space-x-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('admissions')}
                    className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'admissions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Activity className="inline-block w-4 h-4 mr-2" />
                    Active Admissions
                </button>
                {(user?.role === 'Admin') && (
                    <button
                        onClick={() => setActiveTab('wards')}
                        className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'wards' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutDashboard className="inline-block w-4 h-4 mr-2" />
                        Wards & Beds
                    </button>
                )}
            </div>

            {activeTab === 'admissions' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Patient</th>
                                    <th className="px-6 py-4 font-medium">Ward</th>
                                    <th className="px-6 py-4 font-medium">Bed</th>
                                    <th className="px-6 py-4 font-medium">Admission Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {admissions.map(adm => (
                                    <tr key={adm.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-800">{adm.patient_name}</div>
                                            <div className="text-xs text-gray-500">{adm.patient_phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium">
                                                {adm.ward_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{adm.bed_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(adm.admission_date).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/inpatient/${adm.id}`)}
                                                className="text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors"
                                            >
                                                Manage &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {admissions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No active admissions
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'wards' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setIsWardModalOpen(true)}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                            + Add Ward
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {wards.map(ward => (
                            <div key={ward.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{ward.name} <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded ml-2">{ward.type}</span></h3>
                                        <div className="text-sm text-gray-500 flex items-center mt-1"><IndianRupee size={14} className="mr-1"/> {ward.cost_per_day} / day</div>
                                    </div>
                                    <button onClick={() => handleDeleteWard(ward.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Beds ({ward.beds.length})</h4>
                                        <button 
                                            onClick={() => { setSelectedWardForBed(ward.id); setIsBedModalOpen(true); }}
                                            className="text-xs font-medium text-primary-600 hover:text-primary-800"
                                        >
                                            + Add Bed
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ward.beds.map(bed => (
                                            <div key={bed.id} className={`p-3 rounded-lg border flex justify-between items-center ${bed.status === 'Available' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                <div className="flex items-center gap-2">
                                                    <Bed size={16} className={bed.status === 'Available' ? 'text-green-600' : 'text-red-600'} />
                                                    <span className={`text-sm font-medium ${bed.status === 'Available' ? 'text-green-800' : 'text-red-800'}`}>{bed.bed_number}</span>
                                                </div>
                                                {bed.status === 'Available' && (
                                                    <button onClick={() => handleDeleteBed(bed.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ADMIT PATIENT MODAL */}
            {isAdmitModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Admit Patient</h2>
                            <button onClick={() => setIsAdmitModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            {!selectedPatient ? (
                                <div className="space-y-4">
                                    <form onSubmit={handleSearch} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search patient by name or phone..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900">
                                            <Search size={18} /> Search
                                        </button>
                                    </form>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {searchResults.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedPatient(p)}>
                                                <div>
                                                    <div className="font-semibold text-gray-800">{p.name}</div>
                                                    <div className="text-sm text-gray-500">{p.phone} • {p.age} yrs • {p.gender}</div>
                                                </div>
                                                <button className="text-primary-600 text-sm font-medium px-3 py-1 bg-primary-50 rounded-lg">Select</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleAdmit} className="space-y-5">
                                    <div className="bg-primary-50 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="text-sm text-primary-600 font-medium">Selected Patient</div>
                                            <div className="font-bold text-gray-800 text-lg">{selectedPatient.name}</div>
                                        </div>
                                        <button type="button" onClick={() => setSelectedPatient(null)} className="text-sm text-gray-500 hover:underline">Change</button>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Bed</label>
                                        <select 
                                            required
                                            value={admitForm.bed_id}
                                            onChange={e => setAdmitForm({...admitForm, bed_id: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        >
                                            <option value="">-- Select Available Bed --</option>
                                            {getAvailableBeds().map(b => (
                                                <option key={b.id} value={b.id}>{b.ward_name} - {b.bed_number} (₹{b.cost}/day)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment (₹)</label>
                                        <input 
                                            type="number" 
                                            value={admitForm.advance_payment}
                                            onChange={e => setAdmitForm({...admitForm, advance_payment: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    
                                    {parseFloat(admitForm.advance_payment || 0) > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Mode</label>
                                            <select 
                                                required
                                                value={admitForm.payment_mode_id}
                                                onChange={e => setAdmitForm({...admitForm, payment_mode_id: parseInt(e.target.value)})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            >
                                                <option value="">-- Select Mode --</option>
                                                {paymentModes.map(pm => (
                                                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end gap-3 border-t">
                                        <button type="button" onClick={() => setIsAdmitModalOpen(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-5 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-md">Admit Patient</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ADD WARD MODAL */}
            {isWardModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add New Ward</h2>
                            <button onClick={() => setIsWardModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddWard} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
                                <input required type="text" value={wardForm.name} onChange={e => setWardForm({...wardForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. General Ward 3" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select value={wardForm.type} onChange={e => setWardForm({...wardForm, type: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="General">General</option>
                                    <option value="ICU">ICU</option>
                                    <option value="Special">Special</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Day (₹)</label>
                                <input required type="number" value={wardForm.cost_per_day} onChange={e => setWardForm({...wardForm, cost_per_day: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Generate Beds (Optional)</label>
                                <input type="number" min="0" value={wardForm.number_of_beds} onChange={e => setWardForm({...wardForm, number_of_beds: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. 20" />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsWardModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg">Save Ward</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD BED MODAL */}
            {isBedModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add Bed</h2>
                            <button onClick={() => setIsBedModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddBed} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds to Generate</label>
                                <input required type="number" min="1" value={bedForm.count} onChange={e => setBedForm({...bedForm, count: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsBedModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg">Save Bed</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fake Payment Gateway Simulation Modal */}
            {showPaymentGateway && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-gray-800 p-6 text-white text-center rounded-t-2xl">
                            <h3 className="font-bold text-xl tracking-wider uppercase text-gray-200">Vanamala Clinic</h3>
                            <p className="text-gray-400 text-sm">Secure Payment Gateway</p>
                        </div>
                        
                        <div className="p-8 space-y-6 text-center">
                            {paymentSuccess ? (
                                <div className="space-y-4 py-8 animate-in zoom-in slide-in-from-bottom-4">
                                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-800">Payment Successful!</h3>
                                    <p className="text-gray-500 font-medium">Admitting patient...</p>
                                </div>
                            ) : paymentProcessing ? (
                                <div className="space-y-6 py-8">
                                    <Loader2 className="animate-spin mx-auto text-primary-600" size={48} />
                                    <h3 className="text-xl font-bold animate-pulse text-gray-700">Processing Payment...</h3>
                                    <p className="text-xs text-gray-400 italic">Please do not close or refresh this window.</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Amount to Pay</div>
                                        <div className="text-5xl font-black text-gray-900 my-2">₹{admitForm.advance_payment}</div>
                                        <div className="text-sm text-gray-500 max-w-xs mx-auto">Admission Advance</div>
                                    </div>

                                    <div className="border-t border-b py-4 space-y-3 outline-none text-left focus:outline-none focus:ring-0 blur-none">
                                        <button onClick={simulatePayment} className="w-full flex items-center justify-between border-2 border-gray-200 p-4 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all font-bold text-gray-700">
                                            <div className="flex items-center space-x-3"><Smartphone className="text-primary-600" /> <span>UPI / PhonePe / GPay</span></div>
                                            <span className="text-xs text-gray-400">Instant</span>
                                        </button>
                                        <button onClick={simulatePayment} className="w-full flex items-center justify-between border-2 border-gray-200 p-4 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all font-bold text-gray-700">
                                            <div className="flex items-center space-x-3"><CreditCard className="text-gray-600" /> <span>Credit / Debit Card</span></div>
                                            <span className="text-xs text-gray-400">Visa/MC</span>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => setShowPaymentGateway(false)} 
                                        className="text-gray-400 hover:text-gray-600 font-medium text-sm mt-4 inline-block"
                                    >
                                        Cancel Payment
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
