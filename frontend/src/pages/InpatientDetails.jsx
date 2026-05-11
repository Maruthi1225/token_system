import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Printer, Trash2, Calendar, User, Bed, IndianRupee, X, CheckCircle, Loader2, Smartphone, CreditCard } from 'lucide-react';

export default function InpatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [admission, setAdmission] = useState(null);
    const [services, setServices] = useState([]);
    
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceForm, setServiceForm] = useState({ service_name: '', cost: '', quantity: 1 });
    
    const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
    const [paymentModes, setPaymentModes] = useState([]);
    const [dischargeForm, setDischargeForm] = useState({ payment_mode_id: '' });

    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        fetchAdmissionDetails();
        fetchPaymentModes();
    }, [id]);

    const fetchPaymentModes = async () => {
        try {
            const res = await axios.get('http://localhost:5000/masters/payment-modes');
            setPaymentModes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAdmissionDetails = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/inpatient/admissions/${id}`);
            setAdmission(res.data);
            setServices(res.data.services || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:5000/inpatient/services`, {
                admission_id: id,
                ...serviceForm
            });
            setIsServiceModalOpen(false);
            setServiceForm({ service_name: '', cost: '', quantity: 1 });
            fetchAdmissionDetails();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            await axios.delete(`http://localhost:5000/inpatient/services/${serviceId}`);
            fetchAdmissionDetails();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDischarge = () => {
        setIsDischargeModalOpen(true);
    };

    const submitDischarge = async (e) => {
        e.preventDefault();
        
        // Calculate totals right before discharge
        const startDate = new Date(admission.admission_date);
        const diffTime = Math.abs(new Date() - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const totalRoomCharge = diffDays * admission.cost_per_day;
        const totalServicesCharge = services.reduce((sum, s) => sum + s.total, 0);
        const grandTotal = totalRoomCharge + totalServicesCharge;
        const advance = admission.advance_payment || 0;
        const balance = Math.max(0, grandTotal - advance);

        if (balance > 0 && !dischargeForm.payment_mode_id) {
            return alert('Please select a payment mode for the balance amount.');
        }

        const selectedMode = paymentModes.find(pm => pm.id === dischargeForm.payment_mode_id);
        
        if (balance > 0 && selectedMode && selectedMode.name.toLowerCase() !== 'cash') {
            setIsDischargeModalOpen(false);
            setShowPaymentGateway(true);
            setPaymentProcessing(false);
            setPaymentSuccess(false);
        } else {
            completeDischarge(grandTotal, balance);
        }
    };

    const simulatePayment = () => {
        setPaymentProcessing(true);
        setTimeout(() => {
            setPaymentProcessing(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                const startDate = new Date(admission.admission_date);
                const diffTime = Math.abs(new Date() - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                const totalRoomCharge = diffDays * admission.cost_per_day;
                const totalServicesCharge = services.reduce((sum, s) => sum + s.total, 0);
                const grandTotal = totalRoomCharge + totalServicesCharge;
                const advance = admission.advance_payment || 0;
                const balance = Math.max(0, grandTotal - advance);
                completeDischarge(grandTotal, balance);
            }, 1000);
        }, 2000);
    };

    const completeDischarge = async (grandTotal, balance) => {
        try {
            const res = await axios.put(`http://localhost:5000/inpatient/admissions/${id}/discharge`, { 
                total_billed: grandTotal,
                balance_paid: balance,
                payment_mode_id: dischargeForm.payment_mode_id || null
            });
            setIsDischargeModalOpen(false);
            setShowPaymentGateway(false);
            fetchAdmissionDetails();
            alert('Patient discharged successfully!');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to discharge');
            setShowPaymentGateway(false);
        }
    };

    const handlePrintBill = () => {
        window.print();
    };

    if (!admission) return <div className="p-8 text-center text-gray-500">Loading details...</div>;

    // Calculate totals
    const isDischarged = admission.status === 'Discharged';
    const endDate = isDischarged ? new Date(admission.discharge_date) : new Date();
    const startDate = new Date(admission.admission_date);
    
    // Calculate days (minimum 1 day)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const totalRoomCharge = diffDays * admission.cost_per_day;
    const totalServicesCharge = services.reduce((sum, s) => sum + s.total, 0);
    const advance = admission.advance_payment || 0;
    const grandTotal = totalRoomCharge + totalServicesCharge;
    const balance = grandTotal - advance;

    return (
        <div className="space-y-6 max-w-5xl mx-auto w-full">
            <div className="no-print flex justify-between items-center">
                <button 
                    onClick={() => navigate('/inpatients')}
                    className="flex items-center text-gray-500 hover:text-gray-800 transition-colors font-medium"
                >
                    <ArrowLeft size={18} className="mr-2" /> Back to Inpatients
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={handlePrintBill}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Printer size={18} /> Print Bill
                    </button>
                    {!isDischarged && (
                        <button 
                            onClick={handleDischarge}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all"
                        >
                            Discharge Patient
                        </button>
                    )}
                </div>
            </div>

            {/* Bill / Summary Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden" id="printable-bill">
                {isDischarged && (
                    <div className="absolute top-6 right-8 border-4 border-red-500 text-red-500 font-bold text-2xl uppercase tracking-widest px-4 py-1 rotate-12 opacity-80">
                        DISCHARGED
                    </div>
                )}
                
                <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Vanamala Clinic</h1>
                        <p className="text-gray-500 font-medium">Inpatient Discharge Summary & Bill</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Admission ID</div>
                        <div className="text-2xl font-bold text-primary-600">IP-{admission.id.toString().padStart(4, '0')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><User size={16} className="mr-2"/> Patient Info</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-bold text-gray-800">{admission.patient_name}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Age / Gender:</span> <span className="font-medium text-gray-800">{admission.patient_age} / {admission.patient_gender}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-800">{admission.patient_phone}</span></div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center"><Bed size={16} className="mr-2"/> Admission Details</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between"><span className="text-gray-500">Ward & Bed:</span> <span className="font-bold text-blue-800">{admission.ward_name} - {admission.bed_number}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Admitted:</span> <span className="font-medium text-gray-800">{new Date(admission.admission_date).toLocaleString()}</span></div>
                            {isDischarged && (
                                <div className="flex justify-between"><span className="text-gray-500">Discharged:</span> <span className="font-medium text-gray-800">{new Date(admission.discharge_date).toLocaleString()}</span></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Services & Treatments</h3>
                        {!isDischarged && (
                            <button 
                                onClick={() => setIsServiceModalOpen(true)}
                                className="no-print text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg flex items-center hover:bg-gray-800"
                            >
                                <Plus size={16} className="mr-1" /> Add Service
                            </button>
                        )}
                    </div>
                    
                    <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100 text-gray-700 text-sm">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3 font-semibold">Description</th>
                                <th className="px-4 py-3 font-semibold text-right">Cost (₹)</th>
                                <th className="px-4 py-3 font-semibold text-center">Qty</th>
                                <th className="px-4 py-3 font-semibold text-right">Total (₹)</th>
                                {!isDischarged && <th className="px-4 py-3 no-print text-right"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {/* Room Charges Row */}
                            <tr className="bg-blue-50/30">
                                <td className="px-4 py-3 text-gray-500">{new Date(admission.admission_date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-medium text-blue-800">Room Charges ({admission.ward_name})</td>
                                <td className="px-4 py-3 text-right">{admission.cost_per_day}</td>
                                <td className="px-4 py-3 text-center">{diffDays} Days</td>
                                <td className="px-4 py-3 text-right font-bold">{totalRoomCharge}</td>
                                {!isDischarged && <td className="no-print"></td>}
                            </tr>
                            
                            {/* Other Services */}
                            {services.map(srv => (
                                <tr key={srv.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">{new Date(srv.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{srv.service_name}</td>
                                    <td className="px-4 py-3 text-right">{srv.cost}</td>
                                    <td className="px-4 py-3 text-center">{srv.quantity}</td>
                                    <td className="px-4 py-3 text-right font-medium">{srv.total}</td>
                                    {!isDischarged && (
                                        <td className="px-4 py-3 text-right no-print">
                                            <button onClick={() => handleDeleteService(srv.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan={!isDischarged ? 6 : 5} className="px-4 py-6 text-center text-gray-400 italic">No additional services recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t-2 border-gray-800 pt-6 flex justify-end">
                    <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between text-gray-600 text-lg">
                            <span>Grand Total (Services + Room):</span>
                            <span className="font-bold text-gray-900">₹ {grandTotal}</span>
                        </div>
                        {advance > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Advance Paid (At Admission):</span>
                                <span className="font-bold text-green-600">- ₹ {advance}</span>
                            </div>
                        )}
                        {isDischarged ? (
                            <>
                                <div className="flex justify-between text-gray-600">
                                    <span>Balance Paid (At Discharge):</span>
                                    <span className="font-bold text-green-600">- ₹ {admission.balance_paid || 0}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black text-green-700 border-t border-gray-200 pt-3 mt-1">
                                    <span>Final Status:</span>
                                    <span>SETTLED (₹ 0)</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-between text-xl font-black text-red-600 border-t border-gray-200 pt-3 mt-1">
                                <span>Current Balance Due:</span>
                                <span>₹ {balance > 0 ? balance : 0}</span>
                            </div>
                        )}
                    </div>
                </div>

                {isDischarged && (
                    <div className="mt-16 border-t border-gray-200 pt-8 flex justify-between text-gray-500 text-sm font-medium">
                        <div>Authorized Signatory</div>
                        <div>Patient/Attendant Signature</div>
                    </div>
                )}
            </div>

            {/* ADD SERVICE MODAL */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Add Service / Test</h2>
                            <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddService} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input required type="text" value={serviceForm.service_name} onChange={e => setServiceForm({...serviceForm, service_name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Blood Test, Saline..." />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                                    <input required type="number" value={serviceForm.cost} onChange={e => setServiceForm({...serviceForm, cost: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div className="w-24">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input required type="number" min="1" value={serviceForm.quantity} onChange={e => setServiceForm({...serviceForm, quantity: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-sm">Save Service</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DISCHARGE MODAL */}
            {isDischargeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-red-50">
                            <h2 className="text-xl font-bold text-red-700">Discharge Patient</h2>
                            <button onClick={() => setIsDischargeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={submitDischarge} className="p-6 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Balance to Collect</div>
                                <div className="text-5xl font-black text-gray-900">₹{balance > 0 ? balance : 0}</div>
                                {balance <= 0 && <div className="text-sm text-green-600 font-bold mt-2">Bill is fully settled.</div>}
                            </div>
                            
                            {balance > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Mode for Balance</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {paymentModes.map(pm => (
                                            <button 
                                                key={pm.id}
                                                type="button"
                                                onClick={() => setDischargeForm({ payment_mode_id: pm.id })}
                                                className={`py-3 rounded-xl border-2 font-bold transition-all ${dischargeForm.payment_mode_id === pm.id ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                {pm.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsDischargeModalOpen(false)} className="px-4 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-3 font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-md">Confirm Discharge</button>
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
                                    <p className="text-gray-500 font-medium">Discharging patient...</p>
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
                                        <div className="text-5xl font-black text-gray-900 my-2">₹{balance}</div>
                                        <div className="text-sm text-gray-500 max-w-xs mx-auto">Discharge Settlement</div>
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
