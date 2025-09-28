import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from './axiosInstance'; // Import axiosInstance

const API_BASE_URL = "https://employeemanagement.company/api";

export default function EmployeePayment({ employeeId, employeeName, onBack }) {
    const [allPayslips, setAllPayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null); // Holds the payslip object for detail view
    const [showDetail, setShowDetail] = useState(false); // Controls visibility of the detail view
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to parse month strings for consistent sorting
    const parseMonth = (monthStr) => {
        if (!monthStr) return new Date(0);
        const [monthName, year] = monthStr.split(' ');
        const monthIndex = new Date(Date.parse(monthName + " 1, " + year)).getMonth();
        return new Date(year, monthIndex);
    };

    const fetchAllPayslips = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using the correct endpoint for the logged-in user's payslips
            const response = await axiosInstance.get(`${API_BASE_URL}/my-salary-slips/`);
            const sortedPayslips = response.data.sort((a, b) => {
                const dateA = parseMonth(a.month);
                const dateB = parseMonth(b.month);
                return dateB - dateA; // Descending order (most recent first)
            });
            setAllPayslips(sortedPayslips);
        } catch (err) {
            console.error("Error fetching payslips:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError("You are not authorized to view this information. Please log in.");
            } else {
                setError("Failed to load payslips. Please try again later.");
            }
            setAllPayslips([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllPayslips();
    }, [employeeId, employeeName]); // employeeId/Name might be used for future local filtering or display logic

    // Memoized calculation for the currently selected payslip's summary
    const employeeSummary = useMemo(() => {
        if (!selectedPayslip) {
            return {
                name: employeeName,
                month: "N/A",
                basicSalary: 0,
                deductions: [],
                allowances: [],
                totalDeductions: 0,
                totalAllowances: 0,
                netSalary: 0,
                status: "N/A"
            };
        }

        return {
            name: employeeName,
            month: selectedPayslip.month,
            basicSalary: Number(selectedPayslip.basic_salary || 0),
            deductions: selectedPayslip.deductions || [],
            allowances: selectedPayslip.allowances || [],
            totalDeductions: Number(selectedPayslip.total_deductions || 0),
            totalAllowances: Number(selectedPayslip.total_allowances || 0),
            netSalary: Number(selectedPayslip.net_pay || 0),
            status: selectedPayslip.status
        };
    }, [selectedPayslip, employeeName]);

    // Helper function to format numbers without .00
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
    };

    // Handler to show detail view for a specific payslip
    const handleViewPayslipDetail = (payslip) => {
        setSelectedPayslip(payslip);
        setShowDetail(true);
    };

    // Handler to go back from detail view to payslip list
    const handleBackFromDetail = () => {
        setShowDetail(false);
        setSelectedPayslip(null); // Clear selected payslip when going back
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans transition-transform duration-300 ease-out translate-x-0 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mb-4"></div>
                    <p className="text-neutral-600">Loading payment data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans transition-transform duration-300 ease-out translate-x-0 p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button
                    onClick={onBack}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                    Back to Settings
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans transition-transform duration-300 ease-out translate-x-0">
            {/* Main Payslip List View */}
            <header className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-between">
                <button onClick={onBack} className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    <span className="font-medium">Back</span>
                </button>
                <h1 className="text-xl font-semibold text-neutral-900 truncate mx-2">
                    My Payments
                </h1>
                <div className="w-12"></div> {/* Spacer for alignment */}
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    <h2 className="text-2xl font-bold text-neutral-800 mb-4">Your Payslips</h2>

                    {allPayslips.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-md divide-y divide-neutral-100">
                            {allPayslips.map(payslip => (
                                <button
                                    key={payslip.id}
                                    onClick={() => handleViewPayslipDetail(payslip)}
                                    className="block w-full text-left p-4 hover:bg-neutral-50 transition-colors duration-150"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-lg font-semibold text-neutral-800">{payslip.month}</p>
                                            <p className="text-sm text-neutral-500">Net Pay: Rs {formatNumber(Number(payslip.net_pay || 0))}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            payslip.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {payslip.status}
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md p-6 text-center">
                            <p className="text-neutral-600 text-lg">No payslip data available.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Payslip Detail View - Slides in */}
            <div className={`fixed inset-0 bg-neutral-50 z-30 flex flex-col font-sans
                       transition-transform duration-300 ease-out
                       ${showDetail ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {showDetail && selectedPayslip && (
                    <>
                        {/* Detail Top Bar */}
                        <header className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-between">
                            <button onClick={handleBackFromDetail} className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                <span className="font-medium">Payslips</span>
                            </button>
                            <h1 className="text-xl font-semibold text-neutral-900 truncate mx-2">
                                Payslip Details
                            </h1>
                            <div className="w-12"></div> {/* Spacer for alignment */}
                        </header>

                        {/* Detail Content */}
                        <main className="flex-1 overflow-y-auto p-4">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {/* Employee Name & Current Month Display */}
                                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                                    <h2 className="text-2xl font-bold text-neutral-800 mb-1">{employeeSummary.name}</h2>
                                    <p className="text-lg text-neutral-600 mb-4">
                                        {employeeSummary.month ? `Payslip for ${employeeSummary.month}` : "N/A"}
                                    </p>
                                    {/* Net Salary - Prominent Display */}
                                    <div className="mt-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                                        <p className="text-sm uppercase opacity-90">Total Net Pay</p>
                                        <p className="text-3xl font-extrabold">Rs {formatNumber(employeeSummary.netSalary)}</p>
                                    </div>
                                    <p className={`text-md font-semibold mt-4 ${employeeSummary.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                        Status: {employeeSummary.status}
                                    </p>
                                </div>

                                {/* Basic Salary */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Earnings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Basic Salary</label>
                                            <p className="w-full px-4 py-2 border rounded-lg bg-neutral-100 border-neutral-200 text-neutral-800">
                                                Rs {formatNumber(employeeSummary.basicSalary)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions Section */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Deductions</h3>
                                    <div className="space-y-4">
                                        {employeeSummary.deductions.length > 0 ? (
                                            employeeSummary.deductions.map((deduction, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Reason</label>
                                                        <p className="w-full px-4 py-2 border rounded-lg bg-neutral-100 border-neutral-200 text-neutral-800">
                                                            {deduction.reason}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                                                        <p className="w-full px-4 py-2 border rounded-lg bg-red-50 border-red-200 text-red-800 font-medium">
                                                            - Rs {formatNumber(Number(deduction.amount))}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-neutral-500 text-sm">No deductions for this payslip.</p>
                                        )}
                                        {employeeSummary.totalDeductions > 0 && (
                                            <div className="mt-4 pt-4 border-t border-neutral-200">
                                                <p className="text-lg font-semibold text-neutral-800 flex justify-between">
                                                    <span>Total Deductions:</span>
                                                    <span className="text-red-700">- Rs {formatNumber(employeeSummary.totalDeductions)}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Allowances Section */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Allowances</h3>
                                    <div className="space-y-4">
                                        {employeeSummary.allowances.length > 0 ? (
                                            employeeSummary.allowances.map((allowance, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                                                        <p className="w-full px-4 py-2 border rounded-lg bg-neutral-100 border-neutral-200 text-neutral-800">
                                                            {allowance.name}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                                                        <p className="w-full px-4 py-2 border rounded-lg bg-green-50 border-green-200 text-green-800 font-medium">
                                                            + Rs {formatNumber(Number(allowance.amount))}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-neutral-500 text-sm">No allowances for this payslip.</p>
                                        )}
                                        {employeeSummary.totalAllowances > 0 && (
                                            <div className="mt-4 pt-4 border-t border-neutral-200">
                                                <p className="text-lg font-semibold text-neutral-800 flex justify-between">
                                                    <span>Total Allowances:</span>
                                                    <span className="text-green-700">+ Rs {formatNumber(employeeSummary.totalAllowances)}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </main>
                    </>
                )}
            </div>
        </div>
    );
}