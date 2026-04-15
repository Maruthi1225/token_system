import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Printer } from 'lucide-react';

export default function PatientReport() {
    const { id } = useParams();
    
    // Default to 'All', but allowed: 'All', 'Daily', 'Weekly'
    const [filter, setFilter] = useState('All'); 
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [id, filter]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `http://localhost:5000/reports/patient/${id}`;
            const today = new Date();
            
            if (filter === 'Daily') {
                const dateStr = today.toISOString().split('T')[0];
                url += `?startDate=${dateStr}&endDate=${dateStr}`;
            } else if (filter === 'Weekly') {
                const lastWeek = new Date(today);
                lastWeek.setDate(lastWeek.getDate() - 7);
                url += `?startDate=${lastWeek.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
            }

            const res = await axios.get(url);
            setData(res.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 font-bold text-gray-500">Loading patient history...</div>;
    if (!data || !data.patient) return <div className="p-8 font-bold text-red-500">Patient not found.</div>;

    const { patient, appointments } = data;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center no-print">
                <h1 className="text-3xl font-bold text-gray-800">Patient Clinical Case Sheet</h1>
                <div className="flex space-x-4">
                    <select 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)} 
                        className="border p-2 rounded-lg bg-white shadow-sm font-medium"
                    >
                        <option value="All">All History</option>
                        <option value="Daily">Today Only</option>
                        <option value="Weekly">Last 7 Days</option>
                    </select>
                    <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-md hover:bg-gray-900">
                        <Printer size={20} />
                        <span>Print Report</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                
                {/* Print Header */}
                <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                    <h1 className="text-4xl font-black uppercase tracking-wider text-gray-900">Vanamala Clinic</h1>
                    <p className="text-xl font-bold text-gray-600 mt-2">Patient Clinical Report</p>
                </div>

                {/* Patient Profile */}
                <div className="grid grid-cols-2 text-lg mb-8 bg-gray-50 p-6 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-400 print:p-4 print:mb-6">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Patient Name</div>
                        <div className="font-bold text-2xl">{patient.name}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Contact</div>
                        <div className="font-bold text-xl">{patient.phone}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 col-span-2 flex justify-between print:border-gray-300">
                        <div>
                            <span className="font-bold text-gray-500 mr-2">Age/Gender:</span>
                            <span className="font-semibold">{patient.age} / {patient.gender}</span>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500 mr-2">Address:</span>
                            <span className="font-semibold">{[patient.village, patient.mandal, patient.district].filter(Boolean).join(', ') || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <h2 className="text-2xl font-bold border-b-2 border-gray-100 pb-2 print:border-gray-800">Clinical Encounters</h2>
                    
                    {appointments.length === 0 && (
                        <p className="text-gray-500 italic p-4 text-center bg-gray-50 rounded-lg">No appointments found in this timeframe.</p>
                    )}

                    {appointments.map(appt => (
                        <div key={appt.id} className="border border-gray-200 rounded-xl p-6 print:border-gray-400 print:break-inside-avoid shadow-sm print:shadow-none">
                            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4 print:border-gray-300">
                                <div>
                                    <h3 className="text-xl font-bold text-primary-700 print:text-black">Date: {appt.date}</h3>
                                    <p className="text-gray-600 font-medium">Assigned to: {appt.doctor_name || 'N/A'} — {appt.batch_name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Token No</div>
                                    <div className="text-3xl font-black text-gray-800">{appt.token_number}</div>
                                </div>
                            </div>

                            {/* Vitals Grid */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Recorded Vitals</h4>
                                {appt.weight || appt.bp || appt.temperature ? (
                                    <div className="grid grid-cols-3 gap-y-4 gap-x-8 bg-gray-50 p-5 rounded-xl print:bg-transparent print:border print:border-gray-200">
                                        <div className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold text-gray-500">Weight:</span> <span className="font-semibold">{appt.weight} kg</span></div>
                                        <div className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold text-gray-500">Height:</span> <span className="font-semibold">{appt.height} cm</span></div>
                                        <div className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold text-gray-500">BP:</span> <span className="font-semibold">{appt.bp}</span></div>
                                        <div className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold text-gray-500">Pulse:</span> <span className="font-semibold">{appt.pulse} bpm</span></div>
                                        <div className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold text-gray-500">Temp:</span> <span className="font-semibold">{appt.temperature} °F</span></div>
                                        <div className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold text-gray-500">SpO2:</span> <span className="font-semibold">{appt.spo2} %</span></div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 italic bg-gray-50 p-3 rounded-lg">No vitals recorded yet.</div>
                                )}
                            </div>

                            {/* Comments/Notes */}
                            <div className="mb-4">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Reception Notes</h4>
                                <p className="text-gray-800 bg-yellow-50 p-4 rounded-xl border border-yellow-200 print:bg-transparent print:border-gray-300 print:rounded-none">
                                    {appt.comments || 'None'}
                                </p>
                            </div>
                            
                            {/* Doctor Placeholder Box */}
                            <div className="mt-6 border-t-2 border-dashed border-gray-300 pt-6 mt-8 hidden print:block">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 text-center">Doctor's Assessment & Prescription</h4>
                                <div className="h-48"></div> {/* Blank space for handwriting */}
                                <div className="text-right text-gray-400 text-sm italic pr-8">Signature</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* End Print Notice */}
            <div className="hidden print:block text-center mt-8 text-sm text-gray-400 border-t border-gray-300 pt-4">
                End of Report • Generated securely by Vanamala Clinic
            </div>
        </div>
    );
}
