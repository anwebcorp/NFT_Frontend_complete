/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

const P3Accounts = ({ projectId, headId, onBack }) => {
    const [view, setView] = useState('dailyExpenses'); // dailyExpenses, monthlyExpenses, categories, subcategories, staff, bills
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [bills, setBills] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newExpenseTitle, setNewExpenseTitle] = useState('');
    const [newMonthlyTitle, setNewMonthlyTitle] = useState('');
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [newSubCategoryTitle, setNewSubCategoryTitle] = useState('');
    const [newStaffName, setNewStaffName] = useState('');
    const [newBill, setNewBill] = useState({
        voucher_no: '',
        date: '',
        amount: '',
        expense_type: '',
        purchased_by: '',
        paid_at: '',
        approved_by: ''
    });
    const [billImage, setBillImage] = useState(null); // ADDED: State for the image file
    const [statusMessage, setStatusMessage] = useState('');

    const [selectedIds, setSelectedIds] = useState({ dailyExpenseId: null, monthId: null, categoryId: null, subcategoryId: null, staffId: null });
    const axiosPrivate = useAxiosPrivate();

    // Fetch data based on the current view and selected IDs
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = '';
            let response;
            switch (view) {
                case 'dailyExpenses':
                    url = `projects/${projectId}/heads/${headId}/expenses/`;
                    response = await axiosPrivate.get(url);
                    setDailyExpenses(response.data);
                    break;
                case 'monthlyExpenses':
                    url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`;
                    response = await axiosPrivate.get(url);
                    setMonthlyExpenses(response.data);
                    break;
                case 'categories':
                    url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/`;
                    response = await axiosPrivate.get(url);
                    setCategories(response.data);
                    break;
                case 'subcategories':
                    url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/`;
                    response = await axiosPrivate.get(url);
                    setSubcategories(response.data);
                    break;
                case 'staff':
                    url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/${selectedIds.subcategoryId}/staff/`;
                    response = await axiosPrivate.get(url);
                    setStaffList(response.data);
                    break;
                case 'bills':
                    url = `staff/${selectedIds.staffId}/bills/`;
                    response = await axiosPrivate.get(url);
                    setBills(response.data);
                    break;
                default:
                    break;
            }
            setLoading(false);
        } catch (err) {
            setError(`Failed to fetch ${view}. Please check your connection and login status.`);
            setLoading(false);
            console.error(`Error fetching ${view}:`, err);
        }
    };

    useEffect(() => {
        if (projectId && headId) {
            fetchData();
        }
    }, [projectId, headId, selectedIds.dailyExpenseId, selectedIds.monthId, selectedIds.categoryId, selectedIds.subcategoryId, selectedIds.staffId, view]);

    // Handlers for navigation
    const handleSelectDailyExpense = (id) => {
        setSelectedIds(prev => ({ ...prev, dailyExpenseId: id }));
        setView('monthlyExpenses');
    };

    const handleSelectMonthlyExpense = (id) => {
        setSelectedIds(prev => ({ ...prev, monthId: id }));
        setView('categories');
    };

    const handleSelectCategory = (id) => {
        setSelectedIds(prev => ({ ...prev, categoryId: id }));
        setView('subcategories');
    };

    const handleSelectSubCategory = (id) => {
        setSelectedIds(prev => ({ ...prev, subcategoryId: id }));
        setView('staff');
    };

    const handleSelectStaff = (id) => {
        setSelectedIds(prev => ({ ...prev, staffId: id }));
        setView('bills');
    };

    const handleBack = () => {
        switch (view) {
            case 'monthlyExpenses':
                setView('dailyExpenses');
                setSelectedIds(prev => ({ ...prev, dailyExpenseId: null }));
                break;
            case 'categories':
                setView('monthlyExpenses');
                setSelectedIds(prev => ({ ...prev, monthId: null }));
                break;
            case 'subcategories':
                setView('categories');
                setSelectedIds(prev => ({ ...prev, categoryId: null }));
                break;
            case 'staff':
                setView('subcategories');
                setSelectedIds(prev => ({ ...prev, subcategoryId: null }));
                break;
            case 'bills':
                setView('staff');
                setSelectedIds(prev => ({ ...prev, staffId: null }));
                break;
            default:
                onBack();
        }
    };

    // Form submission handlers
    const handleCreateDailyExpense = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/`, { title: newExpenseTitle });
            setStatusMessage('Daily expense created successfully!');
            setNewExpenseTitle('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create daily expense.');
            console.error("Error creating daily expense:", err);
        }
    };

    const handleCreateMonthlyExpense = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`, { title: newMonthlyTitle });
            setStatusMessage('Monthly expense created successfully!');
            setNewMonthlyTitle('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create monthly expense.');
            console.error("Error creating monthly expense:", err);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/`, { title: newCategoryTitle });
            setStatusMessage('Category created successfully!');
            setNewCategoryTitle('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create category.');
            console.error("Error creating category:", err);
        }
    };

    const handleCreateSubCategory = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/`, { title: newSubCategoryTitle });
            setStatusMessage('Subcategory created successfully!');
            setNewSubCategoryTitle('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create subcategory.');
            console.error("Error creating subcategory:", err);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/${selectedIds.subcategoryId}/staff/`, { name: newStaffName });
            setStatusMessage('Staff member created successfully!');
            setNewStaffName('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create staff member.');
            console.error("Error creating staff member:", err);
        }
    };

    const handleCreateBill = async (e) => {
        e.preventDefault();
        setStatusMessage('');

        const formData = new FormData();
        formData.append('staff', selectedIds.staffId);
        formData.append('voucher_no', newBill.voucher_no);
        formData.append('date', newBill.date);
        formData.append('amount', newBill.amount);
        formData.append('expense_type', newBill.expense_type);
        formData.append('purchased_by', newBill.purchased_by);
        formData.append('paid_at', newBill.paid_at);
        formData.append('approved_by', newBill.approved_by);
        if (billImage) {
            formData.append('bill_image', billImage);
        }

        try {
            await axiosPrivate.post(`staff/${selectedIds.staffId}/bills/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setStatusMessage('Bill created successfully!');
            setNewBill({
                voucher_no: '',
                date: '',
                amount: '',
                expense_type: '',
                purchased_by: '',
                paid_at: '',
                approved_by: ''
            });
            setBillImage(null);
            fetchData();
        } catch (err) {
            setStatusMessage(`Failed to create bill. Error: ${err.response?.data?.non_field_errors || err.response?.data?.voucher_no || 'Unknown error'}`);
            console.error("Error creating bill:", err);
        }
    };

    const renderContent = () => {
        if (loading) return <div className="text-center p-8 text-lg text-neutral-600">Loading {view}...</div>;
        if (error) return <div className="text-center p-8 text-lg text-red-600 font-semibold">{error}</div>;

        switch (view) {
            case 'dailyExpenses':
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-4xl">
                            <h1 className="text-2xl font-bold text-gray-800 text-center mb-12">Daily Expenses</h1>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                {/* Add New Yearly Sheet - Moved to the top */}
                                <div className="flex flex-col items-center justify-center">
                                    <div 
                                        onClick={() => {
                                            // Show form or trigger creation
                                            const title = prompt('Enter yearly sheet title (e.g., "June-2025 to June-2026"):');
                                            if (title) {
                                                setNewExpenseTitle(title);
                                                // Auto-submit
                                                const submitForm = async () => {
                                                    setStatusMessage('');
                                                    try {
                                                        await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/`, { title });
                                                        setStatusMessage('Yearly sheet created successfully!');
                                                        setNewExpenseTitle('');
                                                        fetchData();
                                                    } catch (err) {
                                                        setStatusMessage('Failed to create yearly sheet.');
                                                        console.error("Error creating yearly sheet:", err);
                                                    }
                                                };
                                                submitForm();
                                            }
                                        }}
                                        className="bg-white rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center min-h-[96px] w-full max-w-xs"
                                    >
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 font-medium text-center">Add New Yearly Sheet</p>
                                    </div>
                                    {statusMessage && (
                                        <p className={`mt-4 text-center text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                            {statusMessage}
                                        </p>
                                    )}
                                </div>

                                {/* Existing Yearly Sheets - Moved below */}
                                <div className="space-y-4">
                                    {dailyExpenses.length > 0 ? (
                                        dailyExpenses.map((expense) => (
                                            <div
                                                key={expense.id}
                                                onClick={() => handleSelectDailyExpense(expense.id)}
                                                className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                            >
                                                <h3 className="text-xl font-semibold text-gray-700 mb-2">{expense.title}</h3>
                                                <p className="text-gray-500 text-sm">Total expenses till now: Rs {expense.total_amount ? expense.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hidden lg:block">
                                           
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'monthlyExpenses':
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-6xl">
                            {/* Header */}
                            <h1 className="text-4xl font-bold text-gray-800 text-center mb-12">
                                {dailyExpenses.find(e => e.id === selectedIds.dailyExpenseId)?.title || 'June-2025 – June-2026'}
                            </h1>
                            
                            {/* Grid Layout */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                                {/* Add New Month Sheet Button - Moved to the top */}
                                <div 
                                    onClick={() => {
                                        const title = prompt('Enter month name (e.g., "June 2025"):');
                                        if (title) {
                                            setNewMonthlyTitle(title);
                                            const submitForm = async () => {
                                                setStatusMessage('');
                                                try {
                                                    await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`, { title });
                                                    setStatusMessage('Monthly expense created successfully!');
                                                    setNewMonthlyTitle('');
                                                    fetchData();
                                                } catch (err) {
                                                    setStatusMessage('Failed to create monthly expense.');
                                                    console.error("Error creating monthly expense:", err);
                                                }
                                            };
                                            submitForm();
                                        }
                                    }}
                                    className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-dashed border-gray-300 hover:border-blue-400 min-h-[120px] flex flex-col items-center justify-center"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New Month Sheet</p>
                                </div>
                                {/* Existing monthly expenses - Moved below */}
                                {monthlyExpenses.map((month) => (
                                    <div
                                        key={month.id}
                                        onClick={() => handleSelectMonthlyExpense(month.id)}
                                        className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 min-h-[120px] flex items-center justify-center"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-700 text-center">{month.title}</h3>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Status Message */}
                            {statusMessage && (
                                <div className="text-center">
                                    <p className={`text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                        {statusMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'categories':
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-6xl">
                            <h1 class="text-lg font-bold text-gray-800 text-center mb-8">
                                Categories
                            </h1>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Add New Category Card - Moved to the top */}
                                <div
                                    onClick={() => {
                                        const title = prompt('Enter new category name (e.g., "Food Expenses"):');
                                        if (title) {
                                            setNewCategoryTitle(title);
                                            // Auto-submit
                                            const submitForm = async () => {
                                                setStatusMessage('');
                                                try {
                                                    await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/`, { title });
                                                    setStatusMessage('Category created successfully!');
                                                    setNewCategoryTitle('');
                                                    fetchData();
                                                } catch (err) {
                                                    setStatusMessage('Failed to create category.');
                                                    console.error("Error creating category:", err);
                                                }
                                            };
                                            submitForm();
                                        }
                                    }}
                                    className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-dashed border-gray-300 hover:border-blue-400 min-h-[120px] flex flex-col items-center justify-center"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New Head Expense</p>
                                </div>
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <div
                                            key={category.id}
                                            onClick={() => handleSelectCategory(category.id)}
                                            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 min-h-[120px] flex flex-col items-start justify-center"
                                        >
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">{category.title}</h3>
                                            <p className="text-2xl font-bold text-green-600">
                                                Rs {category.total_amount ? parseFloat(category.total_amount).toLocaleString('en-IN') : '0'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-500 text-base sm:text-lg">No categories found. Create one to get started!</p>
                                    </div>
                                )}
                            </div>
                            {statusMessage && (
                                <div className="text-center mt-6">
                                    <p className={`text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                        {statusMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'subcategories':
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-6xl">
                            {/* Header */}
                            <h1 className="text-4xl font-bold text-gray-800 text-center mb-12">
                                {categories.find(c => c.id === selectedIds.categoryId)?.title || 'Petroleum Expenses'}
                            </h1>
                            {/* Total Expense Card */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center border border-gray-100">
                                <p className="text-gray-500 text-sm mb-2">Total {categories.find(c => c.id === selectedIds.categoryId)?.title || 'Petroleum'} Expenses</p>
                                <p className="text-4xl font-bold text-blue-600">
                                    Rs {subcategories.reduce((sum, sub) => sum + parseFloat(sub.total_amount || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            {/* Grid of Subcategory Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Add New Subcategory Card - Moved to the top */}
                                <div
                                    onClick={() => {
                                        const title = prompt('Enter new subcategory name (e.g., "Car Petroleum"):');
                                        if (title) {
                                            setNewSubCategoryTitle(title);
                                            // Auto-submit
                                            const submitForm = async () => {
                                                setStatusMessage('');
                                                try {
                                                    await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/`, { title });
                                                    setStatusMessage('Subcategory created successfully!');
                                                    setNewSubCategoryTitle('');
                                                    fetchData();
                                                } catch (err) {
                                                    setStatusMessage('Failed to create subcategory.');
                                                    console.error("Error creating subcategory:", err);
                                                }
                                            };
                                            submitForm();
                                        }
                                    }}
                                    className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-dashed border-gray-300 hover:border-blue-400 min-h-[120px] flex flex-col items-center justify-center"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New Sub Expense</p>
                                </div>
                                {subcategories.length > 0 ? (
                                    subcategories.map((subcategory) => (
                                        <div
                                            key={subcategory.id}
                                            onClick={() => handleSelectSubCategory(subcategory.id)}
                                            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 min-h-[120px] flex flex-col items-start justify-center"
                                        >
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">{subcategory.title}</h3>
                                            <p className="text-2xl font-bold text-blue-600">
                                                Rs {subcategory.total_amount ? parseFloat(subcategory.total_amount).toLocaleString('en-IN') : '0'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-500 text-base sm:text-lg">No subcategories found. Create one to get started!</p>
                                    </div>
                                )}
                            </div>
                            {statusMessage && (
                                <div className="text-center mt-6">
                                    <p className={`text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                        {statusMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'staff':
                // Calculate total amount for all staff members
                const totalStaffAmount = staffList.reduce((sum, staff) => sum + parseFloat(staff.total_amount || 0), 0);
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-4xl">
                            <h1 className="text-2xl font-bold text-gray-800 text-center mb-12">Total Staff Expense</h1>
                            
                            {/* Display the total expense */}
                            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center border border-gray-100">
                                <p className="text-4xl font-bold text-gray-900 mt-2">
                                    Rs {totalStaffAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                </p>
                            </div>

                            {/* Grid for staff members and the add new button */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {/* Add New Staff Member Card - Moved to the top */}
                                <div 
                                    onClick={() => {
                                        const name = prompt('Enter staff member name:');
                                        if (name) {
                                            setNewStaffName(name);
                                            const submitForm = async () => {
                                                setStatusMessage('');
                                                try {
                                                    await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/${selectedIds.subcategoryId}/staff/`, { name });
                                                    setStatusMessage('Staff member added successfully!');
                                                    setNewStaffName('');
                                                    fetchData();
                                                } catch (err) {
                                                    setStatusMessage('Failed to add staff member.');
                                                    console.error("Error creating staff member:", err);
                                                }
                                            };
                                            submitForm();
                                        }
                                    }}
                                    className="bg-white rounded-2xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-center min-h-[120px]"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium">Add New Name</p>
                                </div>
                                {staffList.length > 0 ? (
                                    staffList.map((staff) => (
                                        <div
                                            key={staff.id}
                                            onClick={() => handleSelectStaff(staff.id)}
                                            className="bg-white rounded-2xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center text-center min-h-[120px]"
                                        >
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2 break-words">{staff.name}</h3>
                                            <p className="text-xl font-bold text-blue-600">
                                                Rs {parseFloat(staff.total_amount || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-base">No staff members found.</p>
                                    </div>
                                )}
                            </div>
                            
                            {statusMessage && (
                                <p className={`mt-4 text-center text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                    {statusMessage}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'bills':
                return (
                    <div className="flex flex-col items-center p-4 sm:p-6 lg:p-8">
                        <div className="w-full max-w-7xl">
                            {/* Summary Header */}
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                        Total {staffList.find(s => s.id === selectedIds.staffId)?.name || 'Staff'} Expense
                                    </h2>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Total Amount Spent</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                            Rs {bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 mb-1">Total Bills</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{bills.length}</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCreateBill} className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200">
                                <h3 className="text-lg sm:text-xl font-semibold mb-4">Create New Bill</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                                    <input type="text" value={newBill.voucher_no} onChange={(e) => setNewBill({ ...newBill, voucher_no: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Voucher Number" required />
                                    <input type="date" value={newBill.date} onChange={(e) => setNewBill({ ...newBill, date: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" required />
                                    <input type="number" value={newBill.amount} onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Amount" required />
                                    <input type="text" value={newBill.expense_type} onChange={(e) => setNewBill({ ...newBill, expense_type: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Expense Type" required />
                                    <input type="text" value={newBill.purchased_by} onChange={(e) => setNewBill({ ...newBill, purchased_by: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Purchased By" required />
                                    <input type="text" value={newBill.paid_at} onChange={(e) => setNewBill({ ...newBill, paid_at: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Paid At" required />
                                    <input type="text" value={newBill.approved_by} onChange={(e) => setNewBill({ ...newBill, approved_by: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Approved By" required />
                                    <input type="file" onChange={(e) => setBillImage(e.target.files[0])} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                                <button type="submit" className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 transform hover:scale-[1.02]">
                                    Create Bill
                                </button>
                                {statusMessage && <p className={`mt-3 text-center text-sm sm:text-base font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{statusMessage}</p>}
                            </form>
                            <div className="grid gap-3 sm:gap-4">
                                {bills.length > 0 ? (
                                    bills.map((bill) => (
                                        <div key={bill.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                            {/* Bill Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">{bill.expense_type}</h3>
                                                        <div className="flex items-center text-sm text-gray-500 mt-1">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2z"></path>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 13.692V16a2 2 0 002 2h16a2 2 0 002-2v-2.308"></path>
                                                            </svg>
                                                            {new Date(bill.date).toLocaleDateString('en-US', { 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Amount</p>
                                                    <p className="text-xl font-bold text-gray-900">Rs {parseFloat(bill.amount).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Bill Details Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997.997 0 013 12V7a4 4 0 014-4z"></path>
                                                    </svg>
                                                    <div>
                                                        <p className="text-gray-500">Expense Type</p>
                                                        <p className="font-medium text-gray-900">{bill.expense_type}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    </svg>
                                                    <div>
                                                        <p className="text-gray-500">Paid At</p>
                                                        <p className="font-medium text-gray-900">{bill.paid_at}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                    </svg>
                                                    <div>
                                                        <p className="text-gray-500">Purchased By</p>
                                                        <p className="font-medium text-gray-900">{bill.purchased_by}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <div>
                                                        <p className="text-gray-500">Approved By</p>
                                                        <p className="font-medium text-green-600">{bill.approved_by}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bill Image */}
                                            {bill.bill_image && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <a 
                                                        href={bill.bill_image} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                        </svg>
                                                        View Bill Image
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 sm:py-12">
                                        <p className="text-gray-500 text-base sm:text-lg">No bills found. Create one above.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800 relative">
            <div className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm sticky top-0 z-10 flex items-center justify-start">
                <button
                    onClick={handleBack}
                    className="text-blue-600 text-base sm:text-lg font-medium flex items-center hover:text-blue-700 active:text-blue-800 transition-colors duration-200 touch-manipulation"
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back
                </button>
            </div>
            {renderContent()}
        </div>
    );
};

export default P3Accounts;