import React, { useState } from 'react';
import axios from 'axios';
import { Search, Printer } from 'lucide-react';

export default function PreliminaryInvestigation() {
    const [tokenQuery, setTokenQuery] = useState('');
    const [dateQuery, setDateQuery] = useState(new Date().toISOString().split('T')[0]);
    const [appointment, setAppointment] = useState(null);
    const [vitals, setVitals] = useState({ weight: '', height: '', pulse: '', bp: '', temperature: '', spo2: '' });

    const handleSearch = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/appointments?date=${dateQuery}&tokenQuery=${tokenQuery}`);
            if (res.data.length > 0) {
                setAppointment(res.data[0]);
                // Fetch existing vitals if any
                const vitalsRes = await axios.get(`http://localhost:5000/investigations/${res.data[0].id}`);
                if (vitalsRes.data) {
                    setVitals({
                        weight: vitalsRes.data.weight || '',
                        height: vitalsRes.data.height || '',
                        pulse: vitalsRes.data.pulse || '',
                        bp: vitalsRes.data.bp || '',
                        temperature: vitalsRes.data.temperature || '',
                        spo2: vitalsRes.data.spo2 || ''
                    });
                } else {
                    setVitals({ weight: '', height: '', pulse: '', bp: '', temperature: '', spo2: '' });
                }
            } else {
                alert('No appointment found for this token on this date');
                setAppointment(null);
            }
        } catch (error) {
            alert('Search failed');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/investigations', { ...vitals, appointment_id: appointment.id });
            alert('Investigation saved successfully!');
        } catch (error) {
            alert('Failed to save investigation');
        }
    };

    const handlePrintVitals = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 no-print">Preliminary Investigation</h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 no-print">
                <input type="date" value={dateQuery} onChange={e => setDateQuery(e.target.value)} className="border p-2 rounded-lg" />
                <input type="number" placeholder="Token Number" value={tokenQuery} onChange={e => setTokenQuery(e.target.value)} className="border p-2 rounded-lg w-32" />
                <button onClick={handleSearch} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2">
                    <Search size={20} /> <span>Fetch</span>
                </button>
            </div>

            {appointment && (
                <div className="bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden relative">
                    {/* Print Header */}
                    <div className="hidden print:block text-center mb-6 pt-4 border-b pb-4">
                        <h1 className="text-3xl font-black text-gray-900">Vanamala Clinic</h1>
                        <p className="text-gray-600 mt-1">Patient Investigation Token</p>
                    </div>

                    {/* Patient Card Header */}
                    <div className="bg-primary-50 p-6 flex justify-between items-center print:bg-transparent print:border-b print:p-0 print:mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-primary-900">{appointment.patient_name}</h2>
                            <p className="text-primary-700">{appointment.age} yrs • {appointment.gender} • {appointment.patient_phone}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-primary-600 font-bold uppercase tracking-wider">Token</div>
                            <div className="text-4xl font-black text-primary-700">{appointment.token_number}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Weight (kg)', name: 'weight', type: 'number', step: '0.1' },
                                { label: 'Height (cm)', name: 'height', type: 'number', step: '1' },
                                { label: 'Pulse (bpm)', name: 'pulse', type: 'number', step: '1' },
                                { label: 'BP (mmHg)', name: 'bp', type: 'text', placeholder: '120/80' },
                                { label: 'Temperature (°F)', name: 'temperature', type: 'number', step: '0.1' },
                                { label: 'SpO2 (%)', name: 'spo2', type: 'number', step: '1' }
                            ].map(field => (
                                <div key={field.name}>
                                    <label className="block text-sm font-semibold text-gray-600 mb-2">{field.label}</label>
                                    <input
                                        type={field.type}
                                        step={field.step}
                                        placeholder={field.placeholder}
                                        value={vitals[field.name]}
                                        onChange={e => setVitals({ ...vitals, [field.name]: e.target.value })}
                                        className="w-full border-b-2 border-gray-200 py-2 focus:outline-none focus:border-primary-500 text-lg print:border-0 print:p-0 print:text-xl font-medium"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex space-x-4 no-print">
                            <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-green-700 transition">
                                Save Vitals
                            </button>
                            <button type="button" onClick={handlePrintVitals} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-900 transition flex items-center justify-center space-x-2">
                                <Printer size={20} /> <span>Print Ticket</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
