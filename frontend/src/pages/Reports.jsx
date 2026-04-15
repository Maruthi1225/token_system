import React, { useState } from 'react';
import axios from 'axios';
import { Printer } from 'lucide-react';

export default function Reports() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/reports/daily?date=${date}`);
            setData(res.data);
        } catch (error) {
            console.error('Failed to load report');
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h1 className="text-3xl font-bold text-gray-800">Daily Report</h1>
                <button onClick={handlePrint} className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Printer size={20} />
                    <span>Print Report</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 no-print flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 rounded-lg" />
                </div>
                <button onClick={fetchReport} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">
                    Generate Report
                </button>
            </div>

            {/* Print Title */}
            <div className="hidden print:block text-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-black text-gray-900">Vanamala Clinic</h1>
                <p className="text-xl text-gray-600 mt-1">Daily Token Report - {date}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
                <table className="min-w-full divide-y divide-gray-200 print:text-sm">
                    <thead className="bg-gray-50 print:bg-transparent">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Token</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Patient Name</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase hidden md:table-cell">Phone</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Visit Type</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase hidden md:table-cell">Payment</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Fee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">{row.token_number}</td>
                                <td className="px-4 py-3 whitespace-nowrap font-medium">{row.patient_name} <span className="text-gray-400 text-xs text-normal">({row.age}{row.gender?.charAt(0)})</span></td>
                                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-gray-500">{row.patient_phone}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.doctor_name || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs ${row.visit_type === 'New' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{row.visit_type}</span></td>
                                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell text-gray-500">{row.payment_mode || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-900">₹{row.consultation_fee}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No records found for this date.</td>
                            </tr>
                        )}
                        {data.length > 0 && (
                            <tr className="bg-gray-50 print:bg-transparent font-bold">
                                <td colSpan="6" className="px-4 py-3 text-right text-gray-900">Total Revenue:</td>
                                <td className="px-4 py-3 text-right text-green-700">₹{data.reduce((sum, r) => sum + (r.consultation_fee || 0), 0)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
