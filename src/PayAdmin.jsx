import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from './axiosInstance'; // Import axiosInstance

// Add onPayslipUpdate to the destructured props
export default function PayAdmin({ employeeId, employeeName, onBack, onPayslipUpdate }) {
    const [allPayslips, setAllPayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null); // The payslip currently displayed/edited
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false); // State for showing status modal
    const [currentScreen, setCurrentScreen] = useState('payslipDetail'); // New state for managing current view

    // Initial form state (will be populated from selectedPayslip or for a new month)
    const [formData, setFormData] = useState({
        profile: employeeId,
        month: "",
        basic_salary: 0,
        leave_deduction: 0,
        leave_deduction_message: "",
        equipment_recovery: 0,
        equipment_recovery_message: "",
        loan_deduction: 0,
        loan_deduction_message: "",
        advances: [],
        status: "Unpaid" // Default status for new payslips
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
                    basic_salary: Number(latestPayslip.basic_salary || 0), // CONVERT TO NUMBER
                    leave_deduction: Number(latestPayslip.leave_deduction || 0), // CONVERT TO NUMBER
                    leave_deduction_message: latestPayslip.leave_deduction_message || "",
                    equipment_recovery: Number(latestPayslip.equipment_recovery || 0), // CONVERT TO NUMBER
                    equipment_recovery_message: latestPayslip.equipment_recovery_message || "",
                    loan_deduction: Number(latestPayslip.loan_deduction || 0), // CONVERT TO NUMBER
                    loan_deduction_message: latestPayslip.loan_deduction_message || "",
                    // Map advances to ensure their amounts are numbers and include given_on/note
                    advances: (latestPayslip.advances || []).map(adv => ({
                        amount: Number(adv.amount || 0), // CONVERT ADVANCE AMOUNT TO NUMBER
                        given_on: adv.given_on || new Date().toISOString().split('T')[0], // Ensure given_on is present
                        note: adv.note || "" // Ensure note is present
                    })),
                    status: latestPayslip.status
                });
            } else {
                setSelectedPayslip(null);
                setFormData(prev => ({ // Reset formData for a new, empty payslip
                    ...prev,
                    month: "",
                    basic_salary: 0,
                    leave_deduction: 0,
                    leave_deduction_message: "",
                    equipment_recovery: 0,
                    equipment_recovery_message: "",
                    loan_deduction: 0,
                    loan_deduction_message: "",
                    advances: [],
                    status: "Unpaid"
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
        console.log("PayAdmin: useEffect triggered. Current employeeId:", employeeId, "EmployeeName:", employeeName); // Debugging line
        setLoading(true);
        // Reset state when employeeId changes, before fetching new data
        setAllPayslips([]);
        setSelectedPayslip(null);
        setIsEditing(false);
        setShowStatusModal(false);
        setCurrentScreen('payslipDetail'); // Reset current screen
        setFormData({
            profile: employeeId, // Ensure profile is updated for the new employee
            month: "",
            basic_salary: 0,
            leave_deduction: 0,
            leave_deduction_message: "",
            equipment_recovery: 0,
            equipment_recovery_message: "",
            loan_deduction: 0,
            loan_deduction_message: "",
            advances: [],
            status: "Unpaid"
        });
        fetchAllPayslips();
    }, [employeeId, employeeName]); // Dependency array: re-run when employeeId or employeeName changes

    // Memoized calculation for total earnings and deductions
    const employeeSummary = useMemo(() => {
        // Ensure all values are treated as numbers, even if they somehow become null/undefined
        const basicSalary = Number(formData.basic_salary) || 0;
        const leaveDeduction = Number(formData.leave_deduction) || 0;
        const equipmentRecovery = Number(formData.equipment_recovery) || 0;
        const loanDeduction = Number(formData.loan_deduction) || 0;
        const totalAdvances = (formData.advances || []).reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0); // Ensure adv.amount is number

        const totalDeductions = leaveDeduction + equipmentRecovery + loanDeduction + totalAdvances;
        const netSalary = basicSalary - totalDeductions;

        return {
            name: employeeName,
            month: formData.month,
            basicSalary: basicSalary,
            leaveDeduction: leaveDeduction,
            equipmentRecovery: equipmentRecovery,
            loanDeduction: loanDeduction,
            advances: formData.advances,
            totalDeductions: totalDeductions,
            netSalary: netSalary,
            status: formData.status
        };
    }, [formData, employeeName]);

    // Handlers for form changes
    const handleFormChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            // If the input type is 'number', parse the value to a float. Handle empty string as 0.
            [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
        }));
    };

    const handleAdvanceChange = (index, field, value) => {
        const newAdvances = [...formData.advances];
        newAdvances[index] = {
            ...newAdvances[index],
            [field]: field === 'amount' ? (value === '' ? 0 : parseFloat(value)) : value // Ensure amount is parsed
        };
        setFormData(prev => ({ ...prev, advances: newAdvances }));
    };

    const addAdvance = () => {
        const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        setFormData(prev => ({
            ...prev,
            advances: [...prev.advances, { amount: 0, given_on: today, note: "" }] // Added given_on and note
        }));
    };

    const removeAdvance = (index) => {
        setFormData(prev => ({
            ...prev,
            advances: prev.advances.filter((_, i) => i !== index)
        }));
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Revert formData to the last selectedPayslip data or initial state
        if (selectedPayslip) {
            setFormData({
                profile: employeeId,
                month: selectedPayslip.month,
                basic_salary: Number(selectedPayslip.basic_salary || 0), // CONVERT TO NUMBER
                leave_deduction: Number(selectedPayslip.leave_deduction || 0), // CONVERT TO NUMBER
                leave_deduction_message: selectedPayslip.leave_deduction_message || "",
                equipment_recovery: Number(selectedPayslip.equipment_recovery || 0), // CONVERT TO NUMBER
                equipment_recovery_message: selectedPayslip.equipment_recovery_message || "",
                loan_deduction: Number(selectedPayslip.loan_deduction || 0), // CONVERT TO NUMBER
                loan_deduction_message: selectedPayslip.loan_deduction_message || "",
                // Map advances to ensure their amounts are numbers and include given_on/note
                advances: (selectedPayslip.advances || []).map(adv => ({
                    amount: Number(adv.amount || 0), // CONVERT ADVANCE AMOUNT TO NUMBER
                    given_on: adv.given_on || new Date().toISOString().split('T')[0], // Ensure given_on is present
                    note: adv.note || "" // Ensure note is present
                })),
                status: selectedPayslip.status
            });
        } else {
            setFormData(prev => ({ // Reset for a new, empty payslip
                ...prev,
                month: "",
                basic_salary: 0,
                leave_deduction: 0,
                leave_deduction_message: "",
                equipment_recovery: 0,
                equipment_recovery_message: "",
                loan_deduction: 0,
                loan_deduction_message: "",
                advances: [],
                status: "Unpaid"
            }));
        }
    };

    const handleSubmitPayslip = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (!formData.month || Number(formData.basic_salary) <= 0) { // Ensure basic_salary is number for comparison
            setError("Month and Basic Salary are required and Basic Salary must be greater than 0.");
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
            basic_salary: Number(payslip.basic_salary || 0), // CONVERT TO NUMBER
            leave_deduction: Number(payslip.leave_deduction || 0), // CONVERT TO NUMBER
            leave_deduction_message: payslip.leave_deduction_message || "",
            equipment_recovery: Number(payslip.equipment_recovery || 0), // CONVERT TO NUMBER
            equipment_recovery_message: payslip.equipment_recovery_message || "",
            loan_deduction: Number(payslip.loan_deduction || 0), // CONVERT TO NUMBER
            loan_deduction_message: payslip.loan_deduction_message || "",
            // Map advances to ensure their amounts are numbers and include given_on/note
            advances: (payslip.advances || []).map(adv => ({
                amount: Number(adv.amount || 0), // CONVERT ADVANCE AMOUNT TO NUMBER
                given_on: adv.given_on || new Date().toISOString().split('T')[0], // Ensure given_on is present
                note: adv.note || "" // Ensure note is present
            })),
            status: payslip.status
        });
        setIsEditing(false); // Always start with view mode
        setCurrentScreen('payslipDetail'); // Go back to the payslip detail screen
    };

    const handleCreateNewPayslip = () => {
        setSelectedPayslip(null); // Clear selected payslip
        setFormData({ // Reset form for new entry
            profile: employeeId,
            month: "",
            basic_salary: 0,
            leave_deduction: 0,
            leave_deduction_message: "",
            equipment_recovery: 0,
            equipment_recovery_message: "",
            loan_deduction: 0,
            loan_deduction_message: "",
            advances: [],
            status: "Unpaid"
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
            await axiosInstance.patch(`https://employeemanagement.company/api/admin/salary-slips/${selectedPayslip.id}/`, { status: newStatus });
            // Update local state for status without re-fetching all
            setFormData(prev => ({ ...prev, status: newStatus }));
            setSelectedPayslip(prev => prev ? { ...prev, status: newStatus } : null);
            // Optionally, update the status in allPayslips array as well if you show it
            setAllPayslips(prev => prev.map(p => p.id === selectedPayslip.id ? { ...p, status: newStatus } : p));
            if (onPayslipUpdate) { // Notify parent of the status change
                onPayslipUpdate();
            }

        } catch (err) {
            console.error("Error updating status:", err);
            setError("Failed to update status.");
        } finally {
            setLoading(false);
            setShowStatusModal(false); // Close modal
        }
    };

    // Helper function to format numbers without .00
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
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
                        <div className="max-w-4xl mx-auto space-y-4"> {/* Use space-y-4 for consistent spacing between sections */}

                            {/* Employee Name & Current Month Display */}
                            <div className="bg-white rounded-xl shadow-md p-6 text-center">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-1">{employeeSummary.name}</h2>
                                <p className="text-lg text-neutral-600 mb-4">
                                    {employeeSummary.month ? `Payslip for ${employeeSummary.month}` : "No Payslip Selected / New Payslip"}
                                </p>
                                {/* Net Salary - Prominent Display */}
                                <div className="mt-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
                                    <p className="text-sm uppercase opacity-90">Total Salary</p>
                                    <p className="text-3xl font-extrabold">Rs {formatNumber(employeeSummary.netSalary)}</p>
                                </div>
                                {selectedPayslip && (
                                    <p className={`text-md font-semibold mt-4 ${employeeSummary.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                        Status: {employeeSummary.status}
                                    </p>
                                )}
                            </div>

                            {/* Payslip Details Form / Display */}
                            <form onSubmit={handleSubmitPayslip} className="space-y-4"> {/* Outer form for all fields */}
                                {/* Month and Basic Salary - Can remain grouped or be split */}
                                <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="month" className="block text-sm font-medium text-neutral-700 mb-1">Month (e.g., January 2023)</label>
                                        <input
                                            type="text"
                                            id="month"
                                            name="month"
                                            value={formData.month}
                                            onChange={handleFormChange}
                                            readOnly={!isEditing}
                                            className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            placeholder="e.g., January 2023"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="basic_salary" className="block text-sm font-medium text-neutral-700 mb-1">Basic Salary</label>
                                        <input
                                            type="number"
                                            id="basic_salary"
                                            name="basic_salary"
                                            value={formData.basic_salary}
                                            onChange={handleFormChange}
                                            readOnly={!isEditing}
                                            className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Deductions Section - Now a distinct card */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Deductions</h3>
                                    <div className="space-y-4"> {/* Increased space-y for internal elements */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="leave_deduction" className="block text-sm font-medium text-neutral-700 mb-1">Leave Deduction</label>
                                                <input type="number" id="leave_deduction" name="leave_deduction" value={formData.leave_deduction} onChange={handleFormChange} readOnly={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                            </div>
                                            <div>
                                                <label htmlFor="leave_deduction_message" className="block text-sm font-medium text-neutral-700 mb-1">Reason (Leave)</label>
                                                <input type="text" id="leave_deduction_message" name="leave_deduction_message" value={formData.leave_deduction_message} onChange={handleFormChange} readOnly={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="equipment_recovery" className="block text-sm font-medium text-neutral-700 mb-1">Equipment Recovery</label>
                                                <input type="number" id="equipment_recovery" name="equipment_recovery" value={formData.equipment_recovery} onChange={handleFormChange} readOnly={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                            </div>
                                            <div>
                                                <label htmlFor="equipment_recovery_message" className="block text-sm font-medium text-neutral-700 mb-1">Reason (Equipment)</label>
                                                <input type="text" id="equipment_recovery_message" name="equipment_recovery_message" value={formData.equipment_recovery_message} onChange={handleFormChange} readOnly={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="loan_deduction" className="block text-sm font-medium text-neutral-700 mb-1">Loan Deduction</label>
                                                <input type="number" id="loan_deduction" name="loan_deduction" value={formData.loan_deduction} onChange={handleFormChange} readOnly={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                            </div>
                                            <div>
                                                <label htmlFor="loan_deduction_message" className="block text-sm font-medium text-neutral-700 mb-1">Reason (Loan)</label>
                                                <input type="text" id="loan_deduction_message" name="loan_deduction_message" value={formData.loan_deduction_message} onChange={handleFormChange} readOnly={!isEditing}
                                                    className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Advances Section - Now a distinct card */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex justify-between items-center">
                                        Advances
                                        {isEditing && (
                                            <button type="button" onClick={addAdvance} className="text-blue-600 hover:text-blue-800 text-sm flex items-center p-2 rounded-lg hover:bg-blue-50">
                                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                Add Advance
                                            </button>
                                        )}
                                    </h3>
                                    {formData.advances.length === 0 && !isEditing ? (
                                        <p className="text-neutral-500 text-sm">No advances recorded.</p>
                                    ) : (
                                        <div className="space-y-4"> {/* Increased space-y for internal elements */}
                                            {formData.advances.map((advance, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-neutral-50 p-3 rounded-lg"> {/* Slightly differentiate advance items */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                                                        <input
                                                            type="number"
                                                            value={advance.amount}
                                                            onChange={(e) => handleAdvanceChange(index, 'amount', e.target.value)}
                                                            readOnly={!isEditing}
                                                            className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Date Given</label>
                                                        <input
                                                            type="date"
                                                            value={advance.given_on}
                                                            onChange={(e) => handleAdvanceChange(index, 'given_on', e.target.value)}
                                                            readOnly={!isEditing}
                                                            className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                                    </div>
                                                    <div className="md:col-span-1">
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
                                                        <input type="text" value={advance.note} onChange={(e) => handleAdvanceChange(index, 'note', e.target.value)} readOnly={!isEditing}
                                                            className={`w-full px-4 py-2 border rounded-lg ${isEditing ? 'bg-white border-neutral-300' : 'bg-neutral-100 border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                                    </div>
                                                    {isEditing && (
                                                        <button type="button" onClick={() => removeAdvance(index)} className="w-full md:w-auto px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors duration-200">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Total Summary - Deductions */}
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Deductions Summary</h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-md">
                                        <p><span className="font-medium">Basic Salary:</span> Rs {formatNumber(employeeSummary.basicSalary)}</p>
                                        <p><span className="font-medium">Total Deductions:</span> -Rs {formatNumber(employeeSummary.totalDeductions)}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 mt-6">
                                    {isEditing ? (
                                        <>
                                            <button type="button" onClick={handleCancelEdit} className="px-5 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors duration-200">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={loading} className={`px-5 py-2 rounded-lg text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-200`}>
                                                {selectedPayslip ? (loading ? 'Updating...' : 'Update Payslip') : (loading ? 'Creating...' : 'Create Payslip')}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" onClick={handleEditClick} className="px-5 py-2 bg-yellow-500 text-neutral-900 rounded-lg hover:bg-yellow-600 transition-colors duration-200">
                                                Edit Payslip
                                            </button>
                                            {selectedPayslip && (
                                                <button type="button" onClick={() => handleDeletePayslip(selectedPayslip.id)} className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200">
                                                    Delete Payslip
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    </main>

                    {/* Footer - Remains the same good design */}
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
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="flex flex-col items-center justify-center text-blue-600 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                        >
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="text-xs font-medium">Status</span>
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
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                payslip.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {payslip.status}
                                            </div>
                                            <button
                                                onClick={() => handleViewMonth(payslip)}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                            >
                                                View
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </main>
                    {/* No footer for this screen, it's a list view */}
                </>
            )}

            {/* Status Modal - remains independent */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-30">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-neutral-800">Update Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="text-neutral-500 hover:text-neutral-800">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="mb-4 text-neutral-700">Current Status: <span className={`font-semibold ${employeeSummary.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>{employeeSummary.status}</span></p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleStatusChange("Paid")}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                                >
                                    Mark as Paid
                                </button>
                                <button
                                    onClick={() => handleStatusChange("Unpaid")}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                                >
                                    Mark as Unpaid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}