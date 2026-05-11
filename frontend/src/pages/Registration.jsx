import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Printer, CreditCard, Smartphone, CheckCircle, Loader2 } from 'lucide-react';

export default function Registration() {
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        visit_type: 'New',
        date: new Date().toISOString().split('T')[0],
        patient_id: '',
        name: '', gender: '', age: '', village: '', mandal: '', district: '', phone: '',
        doctor_id: '', referral_id: '', batch_id: '', appointment_time: '', 
        payment_mode_id: '', consultation_fee: '500', comments: ''
    });

    const [masters, setMasters] = useState({ doctors: [], referrals: [], batches: [], paymentModes: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [successSnippet, setSuccessSnippet] = useState(null);

    // Payment Simulation State
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        const fetchMasters = async () => {
            const [docs, refs, bats, pays] = await Promise.all([
                axios.get('http://localhost:5000/masters/doctors'),
                axios.get('http://localhost:5000/masters/referrals'),
                axios.get('http://localhost:5000/masters/batches'),
                axios.get('http://localhost:5000/masters/payment-modes')
            ]);
            setMasters({ doctors: docs.data, referrals: refs.data, batches: bats.data, paymentModes: pays.data });
        };
        fetchMasters();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await axios.get(`http://localhost:5000/patients?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Search failed', error);
        }
    };

    const selectPatient = (p) => {
        setFormData({
            ...formData,
            patient_id: p.id, name: p.name, gender: p.gender, age: p.age,
            village: p.village, mandal: p.mandal, district: p.district, phone: p.phone,
            visit_type: 'Old'
        });
        setShowSearch(false);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const selectedMode = masters.paymentModes.find(p => String(p.id) === String(formData.payment_mode_id));
        
        if (selectedMode && selectedMode.name.toLowerCase() === 'cash') {
            completeRegistration();
        } else {
            setShowPaymentGateway(true);
            setPaymentProcessing(false);
            setPaymentSuccess(false);
        }
    };

    const simulatePayment = () => {
        setPaymentProcessing(true);
        setTimeout(() => {
            setPaymentProcessing(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                completeRegistration();
            }, 1000);
        }, 2000);
    };

    const completeRegistration = async () => {
        try {
            const payload = { ...formData };
            if (payload.visit_type === 'New') delete payload.patient_id;
            
            const res = await axios.post('http://localhost:5000/appointments', payload);
            setSuccessSnippet({ token: res.data.token_number, message: res.data.message, data: payload });
            
            // Reset state
            setFormData({
                visit_type: 'New', date: new Date().toISOString().split('T')[0], patient_id: '',
                name: '', gender: '', age: '', village: '', mandal: '', district: '', phone: '',
                doctor_id: '', referral_id: '', batch_id: '', appointment_time: '', 
                payment_mode_id: '', consultation_fee: '500', comments: ''
            });
            setShowPaymentGateway(false);
        } catch (error) {
            alert('Failed to register patient');
            setShowPaymentGateway(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Patient Registration</h1>

            {successSnippet && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-between no-print mb-6">
                    <div className="w-full flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">Registration Successful!</h3>
                            <p>{successSnippet.message}</p>
                        </div>
                        <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-lg">
                            {successSnippet.token}
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="mt-4 bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2">
                        <Printer size={20} /> <span>Print OP Token</span>
                    </button>
                </div>
            )}

            {/* Print Only OP Token Layout */}
            {successSnippet && (
                <div className="hidden print:block border-2 border-gray-800 p-8 rounded-xl max-w-md mx-auto print:shadow-none">
                    <div className="text-center border-b pb-4 mb-4 border-gray-800">
                        <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900">Vanamala Clinic</h1>
                        <p className="text-lg font-bold text-gray-600">Out-Patient Token</p>
                    </div>
                    
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="text-sm font-bold text-gray-500">Date</div>
                            <div className="text-lg font-bold">{successSnippet.data.date}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Token No</div>
                            <div className="text-5xl font-black text-gray-900">{successSnippet.token}</div>
                        </div>
                    </div>

                    <div className="space-y-4 text-lg">
                        <div className="flex border-b border-gray-300 pb-2">
                            <span className="font-bold w-32 text-gray-600">Name:</span> 
                            <span className="font-semibold">{successSnippet.data.name}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-gray-300 pb-2">
                            <div className="flex flex-1"><span className="font-bold w-32 text-gray-600">Age/Gender:</span> <span className="font-semibold">{successSnippet.data.age} / {successSnippet.data.gender}</span></div>
                        </div>
                        <div className="flex border-b border-gray-300 pb-2">
                            <span className="font-bold w-32 text-gray-600">Phone:</span> 
                            <span className="font-semibold">{successSnippet.data.phone}</span>
                        </div>
                        <div className="flex border-b border-gray-300 pb-2">
                            <span className="font-bold w-32 text-gray-600">Doctor:</span> 
                            <span className="font-semibold">
                                {masters.doctors.find(d => String(d.id) === String(successSnippet.data.doctor_id))?.name || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between font-black text-xl pt-4">
                            <span>FEE PAID:</span>
                            <span>₹{successSnippet.data.consultation_fee}</span>
                        </div>
                    </div>
                    <div className="text-center mt-8 text-sm font-bold text-gray-500 italic">Please wait for your turn.</div>
                </div>
            )}

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 no-print">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Top Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                            <div className="flex bg-gray-50 p-1 rounded-lg">
                                <button type="button" onClick={() => setFormData({...formData, visit_type: 'New'})} className={`flex-1 py-2 text-sm font-medium rounded-md ${formData.visit_type === 'New' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>New</button>
                                <button type="button" onClick={() => { setFormData({...formData, visit_type: 'Old'}); setShowSearch(true); }} className={`flex-1 py-2 text-sm font-medium rounded-md ${formData.visit_type === 'Old' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>Old Patient</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full border p-2 rounded-lg bg-gray-50" required />
                        </div>
                    </div>

                    {/* Patient Dets */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="Patient Name" name="name" value={formData.name} onChange={handleChange} className="border p-2 rounded-lg" required />
                            <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded-lg bg-white" required>
                                <option value="" disabled>Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <input placeholder="Age" type="number" name="age" value={formData.age} onChange={handleChange} className="border p-2 rounded-lg" required />
                            <input placeholder="Phone" name="phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded-lg" required />
                            <input placeholder="Village" name="village" value={formData.village} onChange={handleChange} className="border p-2 rounded-lg" />
                            <input placeholder="Mandal" name="mandal" value={formData.mandal} onChange={handleChange} className="border p-2 rounded-lg" />
                            <input placeholder="District" name="district" value={formData.district} onChange={handleChange} className="border p-2 rounded-lg" />
                        </div>
                    </div>

                    {/* Appt Dets */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select name="doctor_id" value={formData.doctor_id} onChange={handleChange} className="border p-2 rounded-lg bg-white" required>
                                <option value="" disabled>Select Doctor</option>
                                {masters.doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select name="referral_id" value={formData.referral_id} onChange={handleChange} className="border p-2 rounded-lg bg-white" required>
                                <option value="" disabled>Select Referral</option>
                                {masters.referrals.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                            </select>
                            <select name="batch_id" value={formData.batch_id} onChange={handleChange} className="border p-2 rounded-lg bg-white" required>
                                <option value="" disabled>Batch</option>
                                {masters.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <input type="time" name="appointment_time" value={formData.appointment_time} onChange={handleChange} className="border p-2 rounded-lg bg-white" />
                            <select name="payment_mode_id" value={formData.payment_mode_id} onChange={handleChange} className="border p-2 rounded-lg bg-white" required>
                                <option value="" disabled>Payment Mode</option>
                                {masters.paymentModes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="number" placeholder="Consultation Fee" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} className="border p-2 rounded-lg bg-gray-100 font-bold focus:outline-none" readOnly required />
                            <input placeholder="Comments" name="comments" value={formData.comments} onChange={handleChange} className="border p-2 rounded-lg md:col-span-3" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors w-full md:w-auto text-lg">
                            Register & Generate Token
                        </button>
                    </div>
                </form>
            </div>

            {/* Old Patient Search Modal Overlay */}
            {showSearch && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-xl">Search Old Patient</h3>
                            <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-red-500 text-xl">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex space-x-2">
                                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or phone..." className="flex-1 border p-2 rounded-lg" />
                                <button type="button" onClick={handleSearch} className="bg-primary-600 text-white px-4 py-2 rounded-lg"><Search size={20} /></button>
                            </div>
                            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                {searchResults.map(p => (
                                    <div key={p.id} className="p-3 border-b flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <div className="font-bold">{p.name} <span className="text-sm font-normal text-gray-500">({p.gender}, {p.age})</span></div>
                                            <div className="text-xs text-gray-500">{p.phone} - {p.village}</div>
                                        </div>
                                        <button onClick={() => selectPatient(p)} className="bg-green-100 text-green-700 px-3 py-1 text-sm rounded cursor-pointer hover:bg-green-200">Select</button>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                    <p className="text-gray-500 font-medium">Generating your Token...</p>
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
                                        <div className="text-5xl font-black text-gray-900 my-2">₹{formData.consultation_fee}</div>
                                        <div className="text-sm text-gray-500 max-w-xs mx-auto">Patient: <span className="font-bold">{formData.name || 'N/A'}</span> • {formData.phone}</div>
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

                                    <button onClick={() => setShowPaymentGateway(false)} className="mx-auto block text-red-500 font-bold text-sm tracking-wide hover:underline mt-4">
                                        Cancel Transaction
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
