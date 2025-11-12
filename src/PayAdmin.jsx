import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from './axiosInstance'; // Import axiosInstance

// Add employeeBasicSalary to the destructured props
export default function PayAdmin({ employeeId, employeeName, employeeBasicSalary, onBack, onPayslipUpdate }) {
    const [allPayslips, setAllPayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null); // The payslip currently displayed/edited
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('payslipDetail'); // New state for managing current view

    // Initial form state (will be populated from selectedPayslip or for a new month)
    const [formData, setFormData] = useState({
        profile: employeeId,
        month: "",
        basic_salary: 0,  // Changed to match backend default value
        deductions: [],
        allowances: [],
        payment_status: "unpaid" // Default status for new payslips - matching backend's values
    });

    // Helper to parse month strings for consistent sorting
    const parseMonth = (monthStr) => {
        if (!monthStr) return new Date(0); // Return a very early date for invalid/empty
        const [monthName, year] = monthStr.split(' ');
        // This relies on JS Date parsing, ensure monthName is recognized
        const monthIndex = new Date(Date.parse(monthName + " 1, " + year)).getMonth();
        return new Date(year, monthIndex);
    };

    // Fetches all payslips for the current employeeId
    const fetchAllPayslips = async () => {
        if (!employeeId) {
            setError("No employee ID provided to fetch payslips.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`https://employeemanagement.company/api/admin/salary-slips/?profile=${employeeId}`);
            // Assuming response.data is an array of payslip objects
            // Sort payslips from most recent to oldest
            const sortedPayslips = response.data.sort((a, b) => {
                const dateA = parseMonth(a.month);
                const dateB = parseMonth(b.month);
                return dateB - dateA; // Descending order
            });
            setAllPayslips(sortedPayslips);

            if (sortedPayslips.length > 0) {
                const latestPayslip = sortedPayslips[0];
                setSelectedPayslip(latestPayslip);
                setFormData({
                    profile: employeeId,
                    month: latestPayslip.month,
                    basic_salary: Number(employeeBasicSalary) || Number(latestPayslip.basic_salary || 0),
                    deductions: latestPayslip.deductions || [],
                    allowances: latestPayslip.allowances || [],
                    payment_status: latestPayslip.payment_status || 'unpaid'
                });
            } else {
                setSelectedPayslip(null);
                setFormData(prev => ({ // Reset formData for a new, empty payslip
                    ...prev,
                    month: "",
                    basic_salary: employeeBasicSalary || 0,
                    deductions: [],
                    allowances: [],
                    payment_status: "unpaid"
                }));
            }
            setCurrentScreen('payslipDetail'); // Always show payslip detail after fetching
        } catch (err) {
            console.error("Error fetching payslips:", err);
            setError("Failed to load payslips.");
            setAllPayslips([]);
            setSelectedPayslip(null);
        } finally {
            setLoading(false);
        }
    };

    // Effect to re-fetch payslips when employeeId changes
    useEffect(() => {
        console.log("PayAdmin: useEffect triggered.");
        console.log("Current employeeId:", employeeId);
        console.log("EmployeeName:", employeeName);
        console.log("EmployeeBasicSalary:", employeeBasicSalary);
        setLoading(true);
        
        // Reset state when employeeId changes, before fetching new data
        setAllPayslips([]);
        setSelectedPayslip(null);
        setIsEditing(false);
        setCurrentScreen('payslipDetail'); // Reset current screen
        
        // Log the value we're about to set
        console.log("Setting basic_salary to:", employeeBasicSalary || 0);
        
        setFormData({
            profile: employeeId, // Ensure profile is updated for the new employee
            month: "",
            basic_salary: employeeBasicSalary || 0, // Use the employee's current basic salary from props
            deductions: [],
            allowances: [],
            status: "Unpaid"
        });
        fetchAllPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId, employeeName, employeeBasicSalary]); // Dependency array: re-run when employeeId or employeeName changes

    // Memoized calculation for total earnings and deductions - updated to match backend
    const employeeSummary = useMemo(() => {
        const basicSalary = Number(formData.basic_salary) || 0;
        const totalDeductions = formData.deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const totalAllowances = formData.allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
        const netSalary = basicSalary - totalDeductions + totalAllowances;

        return {
            name: employeeName,
            month: formData.month,
            basicSalary: basicSalary,
            deductions: formData.deductions,
            allowances: formData.allowances,
            totalDeductions: totalDeductions,
            totalAllowances: totalAllowances,
            netSalary: netSalary,
            status: formData.status
        };
    }, [formData, employeeName]);

    // Handlers for form changes
    const handleFormChange = (e) => {
        const { name, value, type } = e.target;
        // Prevent changing basic_salary
        if (name === 'basic_salary') return;
        
        setFormData(prev => ({
            ...prev,
            // If the input type is 'number', parse the value to a float. Handle empty string as 0.
            [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
        }));
    };

    // New handlers for deductions and allowances
    const addDeduction = () => {
        setFormData(prev => ({
            ...prev,
            deductions: [...prev.deductions, { reason: "", amount: '' }]  // Changed from 0 to empty string
        }));
    };

    const addAllowance = () => {
        setFormData(prev => ({
            ...prev,
            allowances: [...prev.allowances, { name: "", amount: '' }]  // Changed from 0 to empty string
        }));
    };

    const handleDeductionChange = (index, field, value) => {
        const newDeductions = [...formData.deductions];
        newDeductions[index] = {
            ...newDeductions[index],
            [field]: field === 'amount' ? (value === '' ? 0 : parseFloat(value)) : value
        };
        setFormData(prev => ({ ...prev, deductions: newDeductions }));
    };

    const handleAllowanceChange = (index, field, value) => {
        const newAllowances = [...formData.allowances];
        newAllowances[index] = {
            ...newAllowances[index],
            [field]: field === 'amount' ? (value === '' ? 0 : parseFloat(value)) : value
        };
        setFormData(prev => ({ ...prev, allowances: newAllowances }));
    };

    const handleEditClick = (e) => {
        // Prevent any form submission
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Edit button clicked, setting isEditing to true');
        setIsEditing(true);
        
        // Ensure we're working with a copy of the data
        setFormData(prev => ({
            ...prev,
            month: prev.month || '',
            basic_salary: prev.basic_salary || '',
            deductions: [...(prev.deductions || [])].map(d => ({...d})),
            allowances: [...(prev.allowances || [])].map(a => ({...a}))
        }));
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Revert formData to the last selectedPayslip data or initial state
        if (selectedPayslip) {
            setFormData({
                profile: employeeId,
                month: selectedPayslip.month,
                basic_salary: Number(selectedPayslip.basic_salary || 0), // CONVERT TO NUMBER
                deductions: selectedPayslip.deductions || [], // Ensure deductions is an array
                allowances: selectedPayslip.allowances || [], // Ensure allowances is an array
                status: selectedPayslip.status
            });
        } else {
            setFormData(prev => ({ // Reset for a new, empty payslip
                ...prev,
                month: "",
                basic_salary: '',
                deductions: [],
                allowances: [],
                status: "Unpaid"
            }));
        }
    };

    const handleSubmitPayslip = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (!formData.month) {
            setError("Month is required.");
            setLoading(false);
            return;
        }
        // Validate basic_salary as positive integer to match backend PositiveIntegerField
        const basicSalary = Number(formData.basic_salary);
        if (!Number.isInteger(basicSalary) || basicSalary <= 0) {
            setError("Basic Salary must be a positive integer.");
            setLoading(false);
            return;
        }

        try {
            if (selectedPayslip && selectedPayslip.id) {
                // Update existing payslip
                await axiosInstance.put(`https://employeemanagement.company/api/admin/salary-slips/${selectedPayslip.id}/`, formData);
            } else {
                // Create new payslip
                await axiosInstance.post('https://employeemanagement.company/api/admin/salary-slips/', {
                    ...formData,
                    profile: employeeId // Ensure profile ID is sent for new payslip
                });
            }
            setIsEditing(false);
            await fetchAllPayslips(); // Re-fetch to update the list and display
            if (onPayslipUpdate) { // Notify parent of the update/creation
                onPayslipUpdate();
            }
        } catch (err) {
            console.error("Error submitting payslip:", err.response ? err.response.data : err);
            setError("Failed to save payslip. Please check inputs.");
            // More granular error handling for specific fields from backend
            if (err.response && err.response.data) {
                // Example: if backend returns { "month": ["This field is required."] }
                // You might display these under respective fields if you had more complex form errors state
                console.error("Backend errors:", err.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewMonth = (payslip) => {
        setSelectedPayslip(payslip);
        setFormData({
            profile: employeeId,
            month: payslip.month,
            basic_salary: Number(payslip.basic_salary || 0),
            deductions: payslip.deductions || [],
            allowances: payslip.allowances || [],
            payment_status: payslip.payment_status || 'unpaid'
        });
        setIsEditing(false); // Always start with view mode
        setCurrentScreen('payslipDetail'); // Go back to the payslip detail screen
    };

    const handleCreateNewPayslip = () => {
        setSelectedPayslip(null); // Clear selected payslip
        setFormData({ // Reset form for new entry
            profile: employeeId,
            month: "",
            basic_salary: employeeBasicSalary || 0,
            deductions: [],
            allowances: [],
            payment_status: "unpaid"
        });
        setIsEditing(true); // Automatically go to edit mode for new payslip
        setCurrentScreen('payslipDetail'); // Ensure we are on the payslip detail screen
    };

    const handleDeletePayslip = async (payslipId) => {
        if (!window.confirm("Are you sure you want to delete this payslip?")) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axiosInstance.delete(`https://employeemanagement.company/api/admin/salary-slips/${payslipId}/`);
            await fetchAllPayslips(); // Re-fetch to update the list
            if (onPayslipUpdate) { // Notify parent of the deletion
                onPayslipUpdate();
            }
        } catch (err) {
            console.error("Error deleting payslip:", err);
            setError("Failed to delete payslip.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedPayslip || !selectedPayslip.id) {
            setError("No payslip selected to update status.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Ensure we're sending the correct backend status
            const backendStatus = newStatus.toLowerCase();
            if (backendStatus !== 'paid' && backendStatus !== 'unpaid') {
                throw new Error('Invalid status value');
            }

            const response = await axiosInstance.patch(
                `https://employeemanagement.company/api/admin/salary-slips/${selectedPayslip.id}/`,
                { payment_status: backendStatus }
            );

            // Only update state if the API call was successful
            if (response && response.data) {
                // Update formData with the status from the response
                setFormData(prev => ({
                    ...prev,
                    payment_status: response.data.payment_status
                }));

                // Update selectedPayslip with the response data
                setSelectedPayslip(prev => prev ? {
                    ...prev,
                    payment_status: response.data.payment_status
                } : null);

                // Update the status in allPayslips array
                setAllPayslips(prev => prev.map(p => 
                    p.id === selectedPayslip.id 
                    ? { ...p, payment_status: response.data.payment_status }
                    : p
                ));

                if (onPayslipUpdate) {
                    onPayslipUpdate();
                }
            }

        } catch (err) {
            console.error("Error updating status:", err);
            setError("Failed to update status.");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format numbers without .00
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
    };

    // Update the handleDownloadPayslip function to properly handle binary data
    const handleDownloadPayslip = async (payslipId) => {
        try {
            const response = await axiosInstance.get(`salary-slip/${payslipId}/download/`, {
                responseType: 'blob' // Important: this tells axios to handle the response as binary data
            });
            
            // Create a URL for the blob
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip-${payslipId}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading payslip:", err);
            setError("Failed to download payslip.");
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans transition-transform duration-300 ease-out translate-x-0 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mb-4"></div>
                    <p className="text-neutral-600">Loading payslip data...</p>
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
                    Back to Admin Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans transition-transform duration-300 ease-out translate-x-0">
            {currentScreen === 'payslipDetail' && (
                <>
                    {/* Top Bar for Payslip Detail - Keep current clean style */}
                    <header className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-between">
                        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            <span className="font-medium">Back</span>
                        </button>
                        <h1 className="text-xl font-semibold text-neutral-900 truncate mx-2">
                            Payment Management for {employeeName}
                        </h1>
                        <div className="w-12"></div> {/* Spacer for alignment */}
                    </header>

                    {/* Main Content for Payslip Detail */}
                    <main className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {/* Employee Name & Month Input/Display */}
                            <div className="bg-white rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="employee_name" className="block text-sm font-medium text-blue-600 mb-2">
                                            Employee Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="employee_name"
                                                value={employeeName}
                                                readOnly
                                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="month" className="block text-sm font-medium text-blue-600 mb-2">
                                            Month
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="month"
                                                name="month"
                                                value={formData.month}
                                                onChange={handleFormChange}
                                                disabled={!isEditing}
                                                placeholder={isEditing ? "e.g., January 2024" : ""}
                                                className={`w-full p-3 border border-gray-300 rounded-lg ${
                                                    isEditing ? 'bg-white' : 'bg-gray-50'
                                                } focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    !isEditing ? 'cursor-not-allowed' : ''
                                                }`}
                                                required
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Salary Input/Display */}
                            <div className="bg-white rounded-lg p-6">
                                <label htmlFor="basic_salary" className="block text-sm font-medium text-blue-600 mb-2">
                                    Basic Salary (Rs.)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-lg">Rs.</span>
                                    </div>
                                    <input
                                        type="number"
                                        id="basic_salary"
                                        name="basic_salary"
                                        value={formData.basic_salary}
                                        onChange={handleFormChange}
                                        disabled={true}
                                        min="1"
                                        step="1"
                                        className="w-full pl-12 p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Payslip Details Form / Display */}
                            <form onSubmit={handleSubmitPayslip} className="space-y-4">
                                {/* Deductions Section - Now a distinct card */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-neutral-800">Deductions</h3>
                                        {isEditing && (
                                            <button type="button" onClick={addDeduction} className="text-blue-600 hover:text-blue-800">
                                                Add Deduction
                                            </button>
                                        )}
                                    </div>
                                    {formData.deductions.map((deduction, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Reason</label>
                                                <input
                                                    type="text"
                                                    value={deduction.reason}
                                                    onChange={(e) => handleDeductionChange(index, 'reason', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder={isEditing ? "Enter deduction reason" : ""}
                                                    className={`w-full px-4 py-2 border rounded-lg ${
                                                        isEditing ? 'bg-white' : 'bg-neutral-100'
                                                    } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                                                <input
                                                    type="number"
                                                    value={deduction.amount}
                                                    onChange={(e) => handleDeductionChange(index, 'amount', e.target.value)}
                                                    disabled={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${
                                                        isEditing ? 'bg-white' : 'bg-neutral-100'
                                                    } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Allowances Section - Now a distinct card */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-neutral-800">Allowances</h3>
                                        {isEditing && (
                                            <button type="button" onClick={addAllowance} className="text-blue-600 hover:text-blue-800">
                                                Add Allowance
                                            </button>
                                        )}
                                    </div>
                                    {formData.allowances.map((allowance, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={allowance.name}
                                                    onChange={(e) => handleAllowanceChange(index, 'name', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder={isEditing ? "Enter allowance name" : ""}
                                                    className={`w-full px-4 py-2 border rounded-lg ${
                                                        isEditing ? 'bg-white' : 'bg-neutral-100'
                                                    } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                                                <input
                                                    type="number"
                                                    value={allowance.amount}
                                                    onChange={(e) => handleAllowanceChange(index, 'amount', e.target.value)}
                                                    disabled={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${
                                                        isEditing ? 'bg-white' : 'bg-neutral-100'
                                                    } ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Summary - Deductions */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-xl font-semibold mb-6">Salary Calculation</h3>
                                    <div className="space-y-4">
                                        {/* Basic Salary */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-gray-700">Basic Salary:</span>
                                            <span className="text-lg">Rs. {formatNumber(employeeSummary.basicSalary)}</span>
                                        </div>

                                        {/* Total Allowances */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-green-600">Total Allowances:</span>
                                            <span className="text-lg text-green-600">+ Rs. {formatNumber(employeeSummary.totalAllowances)}</span>
                                        </div>

                                        {/* Total Deductions */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg text-red-600">Total Deductions:</span>
                                            <span className="text-lg text-red-600">- Rs. {formatNumber(employeeSummary.totalDeductions)}</span>
                                        </div>

                                        {/* Net Salary - with border top */}
                                        <div className="pt-4 mt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xl font-semibold">Net Salary:</span>
                                                <span className="text-xl font-bold text-blue-600">
                                                    Rs. {formatNumber(employeeSummary.netSalary)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end items-center space-x-4 mt-8 pb-6">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                            >
                                                <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                                                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
                                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                                            >
                                                <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {selectedPayslip ? (loading ? 'Updating...' : 'Update Payslip') : (loading ? 'Creating...' : 'Create Payslip')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Status toggle button */}
                                            {selectedPayslip && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusChange(formData.payment_status === 'paid' ? 'Unpaid' : 'Paid')}
                                                    className={`inline-flex items-center transition-all duration-200
                                                        md:px-4 md:py-2 md:rounded-md md:text-sm
                                                        px-2 py-2 rounded-full text-xs
                                                        border border-transparent font-medium 
                                                        ${formData.payment_status === 'paid' 
                                                        ? 'text-green-700 bg-green-100 hover:bg-green-200' 
                                                        : 'text-red-700 bg-red-100 hover:bg-red-200'
                                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                >
                                                    <svg className="w-4 h-4 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="hidden md:inline">
                                                        {formData.payment_status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
                                                    </span>
                                                </button>
                                            )}
                                            {/* Add download button */}
                                            {selectedPayslip && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadPayslip(selectedPayslip.id)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                                    </svg>
                                                    Download
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleEditClick}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-900 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            {selectedPayslip && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePayslip(selectedPayslip.id)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    </main>

                    {/* Footer - Modified to remove status button */}
                    <footer className="bg-white border-t border-neutral-200 py-3 px-4 shadow-inner flex justify-around items-center z-10">
                        <button
                            onClick={handleCreateNewPayslip}
                            className="flex flex-col items-center justify-center text-green-600 hover:text-green-800 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                        >
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="text-xs font-medium">New Payslip</span>
                        </button>
                        <button
                            onClick={() => setCurrentScreen('allPayslips')}
                            className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                        >
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <span className="text-xs font-medium">All Payslips</span>
                        </button>
                    </footer>
                </>
            )}

            {currentScreen === 'allPayslips' && (
                <>
                    {/* Header for All Payslips List */}
                    <header className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-between">
                        <button onClick={() => setCurrentScreen('payslipDetail')} className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            <span className="font-medium">Back to Details</span>
                        </button>
                        <h1 className="text-xl font-semibold text-neutral-900 truncate mx-2">
                            All Payslips for {employeeName}
                        </h1>
                        <div className="w-12"></div> {/* Spacer for alignment */}
                    </header>

                    {/* Main Content for All Payslips List */}
                    <main className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
                            {allPayslips.length === 0 ? (
                                <p className="text-neutral-600 text-center py-4">No payslips found.</p>
                            ) : (
                                <ul className="divide-y divide-neutral-100">
                                    {allPayslips.map(payslip => (
                                        <li key={payslip.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-neutral-900 font-medium">{payslip.month}</p>

                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    String(payslip.payment_status).toLowerCase() === 'paid' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {String(payslip.payment_status).toLowerCase() === 'paid' ? 'Paid' : 'Unpaid'}
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadPayslip(payslip.id)}
                                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleViewMonth(payslip)}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </main>
                    {/* No footer for this screen, it's a list view */}
                </>
            )}

            {/* Status modal removed in favor of direct toggle button */}
        </div>
    );
}