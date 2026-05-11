import React, { useState } from 'react';
import axios from 'axios';
import { Printer } from 'lucide-react';

export default function Reports() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState({ appointments: [], inpatientAdvances: [], inpatientSettlements: [] });
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/reports/daily?date=${date}`);
            // Check if backend returned new format
            if (res.data.appointments) {
                setReportData(res.data);
            } else {
                setReportData({ appointments: res.data, inpatientAdvances: [], inpatientSettlements: [] });
            }
        } catch (error) {
            console.error('Failed to load report');
        }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const totalOP = reportData.appointments.reduce((sum, r) => sum + (r.consultation_fee || 0), 0);
    const totalAdvances = reportData.inpatientAdvances.reduce((sum, r) => sum + (r.advance_payment || 0), 0);
    const totalSettlements = reportData.inpatientSettlements.reduce((sum, r) => sum + (r.balance_paid || 0), 0);
    const grandTotal = totalOP + totalAdvances + totalSettlements;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h1 className="text-3xl font-bold text-gray-800">Daily Revenue Report</h1>
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
                <p className="text-xl text-gray-600 mt-1">Daily Revenue Report - {date}</p>
            </div>

            {/* OP Tokens Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none mb-8">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Outpatient (OP) Collections</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 print:text-sm">
                    <thead className="bg-gray-50 print:bg-transparent">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Token</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Patient Name</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase hidden md:table-cell">Phone</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Doctor</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase hidden md:table-cell">Payment</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Fee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reportData.appointments.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900">{row.token_number}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-medium">{row.patient_name} <span className="text-gray-400 text-xs text-normal">({row.age}{row.gender?.charAt(0)})</span></td>
                                <td className="px-4 py-2 whitespace-nowrap hidden md:table-cell text-gray-500">{row.patient_phone}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">{row.doctor_name || '-'}</td>
                                <td className="px-4 py-2 whitespace-nowrap hidden md:table-cell text-gray-500">{row.payment_mode || '-'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-900">₹{row.consultation_fee}</td>
                            </tr>
                        ))}
                        {reportData.appointments.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">No OP records found.</td>
                            </tr>
                        )}
                        <tr className="bg-gray-50 font-bold">
                            <td colSpan="5" className="px-4 py-3 text-right text-gray-900">Total OP Revenue:</td>
                            <td className="px-4 py-3 text-right text-primary-700">₹{totalOP}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Inpatient Advances Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none mb-8">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Inpatient Advances (Admissions)</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 print:text-sm">
                    <thead className="bg-gray-50 print:bg-transparent">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Admission ID</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Patient Name</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Ward & Bed</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Advance Paid</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reportData.inpatientAdvances.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900">IP-{row.id.toString().padStart(4, '0')}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-medium">{row.patient_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">{row.ward_name} - {row.bed_number}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-900">₹{row.advance_payment}</td>
                            </tr>
                        ))}
                        {reportData.inpatientAdvances.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-4 py-4 text-center text-gray-500">No advance payments recorded today.</td>
                            </tr>
                        )}
                        <tr className="bg-gray-50 font-bold">
                            <td colSpan="3" className="px-4 py-3 text-right text-gray-900">Total Advances:</td>
                            <td className="px-4 py-3 text-right text-primary-700">₹{totalAdvances}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Inpatient Settlements Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none mb-8">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Inpatient Settlements (Discharges)</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 print:text-sm">
                    <thead className="bg-gray-50 print:bg-transparent">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Admission ID</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Patient Name</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Ward & Bed</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Payment Mode</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Balance Paid</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reportData.inpatientSettlements.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900">IP-{row.id.toString().padStart(4, '0')}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-medium">{row.patient_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-700">{row.ward_name} - {row.bed_number}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{row.payment_mode || 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-gray-900">₹{row.balance_paid}</td>
                            </tr>
                        ))}
                        {reportData.inpatientSettlements.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-4 text-center text-gray-500">No discharge settlements recorded today.</td>
                            </tr>
                        )}
                        <tr className="bg-gray-50 font-bold">
                            <td colSpan="4" className="px-4 py-3 text-right text-gray-900">Total Settlements:</td>
                            <td className="px-4 py-3 text-right text-primary-700">₹{totalSettlements}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl shadow-xl p-8 flex justify-between items-center no-print">
                <div className="text-xl font-bold uppercase tracking-wider text-gray-400">Grand Total Revenue</div>
                <div className="text-5xl font-black">₹{grandTotal}</div>
            </div>
            
            {/* Print Grand Total */}
            <div className="hidden print:flex justify-between items-center border-t-4 border-gray-900 pt-4 mt-8">
                <div className="text-xl font-bold uppercase tracking-wider text-gray-600">Grand Total Daily Revenue</div>
                <div className="text-3xl font-black text-gray-900">₹{grandTotal}</div>
            </div>
        </div>
    );
}
