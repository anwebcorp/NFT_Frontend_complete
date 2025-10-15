/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

const P3Accounts = ({ projectId, headId, onBack }) => {
    const [view, setView] = useState('dailyExpenses'); // dailyExpenses, monthlyExpenses, categories, subcategories, bills, allBills, billActions, allBillsMonths
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]); // State for subcategories
    const [bills, setBills] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newExpenseTitle, setNewExpenseTitle] = useState('');
    const [newMonthlyTitle, setNewMonthlyTitle] = useState('');
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [newSubCategoryTitle, setNewSubCategoryTitle] = useState('');

    const [statusMessage, setStatusMessage] = useState('');

    // State for the new multi-step bill creation process
    const [isCreatingBill, setIsCreatingBill] = useState(false);
    const [billCreationStep, setBillCreationStep] = useState('selectMonth'); // 'selectMonth' or 'enterDetails'
    const [selectedMonthForBill, setSelectedMonthForBill] = useState(null); // The ID of the month to which the bill will be added

    // Updated bill form data to match the backend and new requirements
    const [newBillFormData, setNewBillFormData] = useState({
        voucher_no: '',
        date: '',
        amount: '',
        description: '',
        expense_type: '', // Corresponds to 'category_id' in your old code
        subcategory_id: '', // Corresponds to 'sub_head'
        approved_by: '', // Add this field
        month_id: '' // Add this field
    });
    const [billImage, setBillImage] = useState(null);


    const [selectedIds, setSelectedIds] = useState({ dailyExpenseId: null, monthId: null, categoryId: null, subcategoryId: null });
    const axiosPrivate = useAxiosPrivate();

    // --- Voucher Search State ---
    const [voucherSearchQuery, setVoucherSearchQuery] = useState('');
    const [voucherSearchResults, setVoucherSearchResults] = useState([]);
    const [voucherSearchLoading, setVoucherSearchLoading] = useState(false);
    const [voucherSearchError, setVoucherSearchError] = useState('');

    // State to hold the selected bill from search
    const [selectedBill, setSelectedBill] = useState(null);
    // State for all project bills
    const [allProjectBills, setAllProjectBills] = useState([]);

    // State for dropdown form visibility
    const [showBillCreationForm, setShowBillCreationForm] = useState(false);

    // New states for monthly expenses view
    const [selectedFilterMonth, setSelectedFilterMonth] = useState(null);
    const [showCreateBillForm, setShowCreateBillForm] = useState(false);

    // Quick month options
    const quickMonths = [
        { id: 'jan', label: 'Jan' },
        { id: 'feb', label: 'Feb' },
        { id: 'mar', label: 'Mar' },
        { id: 'apr', label: 'Apr' },
        { id: 'may', label: 'May' },
        { id: 'jun', label: 'Jun' },
        { id: 'jul', label: 'Jul' },
        { id: 'aug', label: 'Aug' },
        { id: 'sep', label: 'Sep' },
        { id: 'oct', label: 'Oct' },
        { id: 'nov', label: 'Nov' },
        { id: 'dec', label: 'Dec' },
    ];

    // Dynamic sizing utility function
    const getBoxSizeClasses = (totalCount) => {
        if (totalCount <= 1) {
            return "w-[200px] h-[200px]"; // Big size for 1 item
        } else if (totalCount === 2) {
            return "w-[180px] h-[180px]"; // Medium-large for 2 items
        } else if (totalCount === 3) {
            return "w-[160px] h-[160px]"; // Medium for 3 items
        } else if (totalCount === 4) {
            return "w-[150px] h-[150px]"; // Medium-small for 4 items
        } else {
            return "w-[140px] h-[140px]"; // Minimum size for 5+ items
        }
    };

    const handleVoucherSearch = async () => {
        if (!voucherSearchQuery.trim()) {
            setVoucherSearchResults([]);
            return;
        }

        setVoucherSearchLoading(true);
        setVoucherSearchError('');
        setVoucherSearchResults([]);
        try {
            // Make sure we have the required IDs
            if (!selectedIds.dailyExpenseId) {
                setVoucherSearchError('Please select a yearly sheet first');
                setVoucherSearchLoading(false);
                return;
            }

            const resp = await axiosPrivate.get(
                `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/bills/search/?voucher_no=${encodeURIComponent(voucherSearchQuery.trim())}`
            );
            if (resp.data) {
                setVoucherSearchResults(Array.isArray(resp.data) ? resp.data : [resp.data]);
            } else {
                setVoucherSearchResults([]);
            }
            setVoucherSearchLoading(false);
        } catch (err) {
            console.error('Search error:', err);
            setVoucherSearchError('Voucher search failed. Please try again.');
            setVoucherSearchLoading(false);
        }
    };

    // Updated to fetch months instead of all bills
    const fetchAllProjectBills = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await axiosPrivate.get(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`);
            setMonthlyExpenses(resp.data);
            setLoading(false);
            setView('allBillsMonths');
        } catch (err) {
            setError('Failed to fetch monthly expenses.');
            setLoading(false);
            console.error("Error fetching all bills:", err);
        }
    };

    // New function to fetch bills for a specific month
    const fetchBillsForMonth = async (monthId) => {
        setLoading(true);
        setError(null);
        try {
            const resp = await axiosPrivate.get(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${monthId}/bills/`);
            setAllProjectBills(resp.data);
            setLoading(false);
            setView('allBills');
        } catch (err) {
            setError('Failed to fetch bills for this month.');
            setLoading(false);
            console.error("Error fetching bills for month:", err);
        }
    }


    const handleViewBill = (bill) => {
        setSelectedBill(bill);
        setView('singleBillView');
    };

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
                    // The categories will be fetched when the user starts the bill creation flow.
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

    // New function to re-fetch monthly expenses
    const fetchMonthlyExpenses = async () => {
        try {
            if (selectedIds.dailyExpenseId) {
                const url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`;
                const response = await axiosPrivate.get(url);
                setMonthlyExpenses(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch monthly expenses:", err);
        }
    };

    // New function to re-fetch categories
    const fetchCategories = async () => {
        try {
            if (selectedIds.dailyExpenseId && selectedIds.monthId) {
                const url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/`;
                const response = await axiosPrivate.get(url);
                setCategories(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    };

    useEffect(() => {
        if (projectId && headId && !isCreatingBill && !['singleBillView', 'allBills', 'billActions', 'allBillsMonths'].includes(view)) {
            // Only fetch if required IDs are present based on the current view
            const shouldFetch = 
                (view === 'dailyExpenses') ||
                (view === 'monthlyExpenses' && selectedIds.dailyExpenseId) ||
                (view === 'categories' && selectedIds.dailyExpenseId && selectedIds.monthId) ||
                (view === 'subcategories' && selectedIds.dailyExpenseId && selectedIds.monthId && selectedIds.categoryId);

            if (shouldFetch) {
                fetchData();
            }
        }
    }, [projectId, headId, selectedIds.dailyExpenseId, selectedIds.monthId, selectedIds.categoryId, selectedIds.subcategoryId, view, isCreatingBill]);

    // Handlers for navigation
    const handleSelectDailyExpense = (id) => {
        setSelectedIds(prev => ({ ...prev, dailyExpenseId: id, monthId: null, categoryId: null, subcategoryId: null }));
        setView('monthlyExpenses');
    };

    const handleSelectMonthlyExpense = (id) => {
        setSelectedIds(prev => ({ ...prev, monthId: id, categoryId: null, subcategoryId: null }));
        setView('categories');
    };

    const handleSelectCategory = (id) => {
        setSelectedIds(prev => ({ ...prev, categoryId: id, subcategoryId: null }));
        setView('subcategories');
    };

    const handleSelectSubCategory = (id) => {
        setSelectedIds(prev => ({ ...prev, subcategoryId: id }));
        // Find the selected subcategory from the state and use its nested bills
        const selectedSubcategory = subcategories.find(sub => sub.id === id);
        if (selectedSubcategory && selectedSubcategory.bills) {
            setBills(selectedSubcategory.bills);
        } else {
            setBills([]);
        }
        setView('bills');
    }

    // Updated handleBack logic
    const handleBack = () => {
        if (isCreatingBill) {
            setIsCreatingBill(false);
            setBillCreationStep('selectMonth');
            setSelectedMonthForBill(null);
            setNewBillFormData({ // Clear form data
                voucher_no: '', date: '', amount: '', description: '',
                expense_type: '', subcategory_id: '', approved_by: '',
                month_id: ''
            });
            setBillImage(null);
            return;
        }

        // Clear error and loading states when navigating back
        setError(null);
        setLoading(false);

        switch (view) {
            case 'monthlyExpenses':
                setView('dailyExpenses');
                setSelectedIds({
                    dailyExpenseId: null,
                    monthId: null,
                    categoryId: null,
                    subcategoryId: null
                });
                break;
            case 'categories':
                setView('monthlyExpenses');
                setSelectedIds(prev => ({
                    ...prev,
                    monthId: null,
                    categoryId: null,
                    subcategoryId: null
                }));
                break;
            case 'subcategories':
                setView('categories');
                setSelectedIds(prev => ({
                    ...prev,
                    categoryId: null,
                    subcategoryId: null
                }));
                break;
            case 'bills':
                setView('subcategories');
                setSelectedIds(prev => ({
                    ...prev,
                    subcategoryId: null
                }));
                setBills([]);
                break;
            case 'singleBillView':
                setSelectedBill(null);
                setView('monthlyExpenses'); // Go directly back to monthly expenses view
                break;
            case 'allBills':
                setView('monthlyExpenses');
                setAllProjectBills([]);
                break;
            case 'allBillsMonths':
                setView('billActions');
                break;
            case 'billActions':
                setView('monthlyExpenses');
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
            setStatusMessage('Yearly sheet created successfully!');
            setNewExpenseTitle('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create yearly sheet.');
            console.error("Error creating yearly sheet:", err);
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
            setStatusMessage('SubCategory created successfully!');
            setNewSubCategoryTitle('');
            fetchData();
        } catch (err) {
            setStatusMessage('Failed to create SubCategory.');
            console.error("Error creating SubCategory:", err);
        }
    };

    // New Bill Creation Logic
    const handleSelectMonthForBill = (monthId) => {
        setSelectedMonthForBill(monthId);
        setBillCreationStep('enterDetails');
    };

    const handleNewBillFormChange = async (e) => {
        const { name, value } = e.target;
        setNewBillFormData(prev => ({ ...prev, [name]: value }));

        // If month changes, fetch categories
        if (name === 'month_id' && value) {
            try {
                const url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${value}/categories/`;
                const response = await axiosPrivate.get(url);
                setCategories(response.data);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                setStatusMessage('Failed to load categories.');
            }
        }

        // If category changes, reset subcategory and fetch new subcategories
        if (name === 'expense_type' && value) {
            setNewBillFormData(prev => ({ ...prev, subcategory_id: '' }));
            try {
                const url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${newBillFormData.month_id}/categories/${value}/subcategories/`;
                const response = await axiosPrivate.get(url);
                setSubcategories(response.data);
            } catch (err) {
                console.error("Failed to fetch subcategories:", err);
                setStatusMessage('Failed to load subcategories.');
            }
        }
    };

    const handleBillImageChange = (e) => {
        setBillImage(e.target.files[0]);
    };

    const submitNewBill = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        if (!selectedIds.dailyExpenseId || !newBillFormData.month_id) {
            setStatusMessage('Error: Daily expense or month not selected.');
            return;
        }

        try {
            const formData = new FormData();
            
            // Map expense_type to category_id for backend compatibility
            const dataToSend = {
                ...newBillFormData,
                category_id: newBillFormData.expense_type // Map expense_type to category_id
            };
            delete dataToSend.expense_type; // Remove the expense_type field
            
            // Add all form fields to formData with correct field names
            Object.keys(dataToSend).forEach(key => {
                if (dataToSend[key]) { // Only add if value exists
                    formData.append(key, dataToSend[key]);
                }
            });
            
            if (billImage) {
                formData.append('bill_image', billImage);
            }

            const createBillUrl = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${newBillFormData.month_id}/bills/`;
            
            // Debug log to verify the data being sent
            console.log('Submitting bill with data:', Object.fromEntries(formData));
            
            const response = await axiosPrivate.post(createBillUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatusMessage('Bill created successfully!');
            
            // Reset form and state
            setIsCreatingBill(false);
            setNewBillFormData({
                voucher_no: '',
                date: '',
                amount: '',
                description: '',
                expense_type: '',
                subcategory_id: '',
                approved_by: '',
                month_id: ''
            });
            setBillImage(null);

            // Refresh the bills list
            if (newBillFormData.month_id) {
                const resp = await axiosPrivate.get(
                    `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${newBillFormData.month_id}/bills/`
                );
                setAllProjectBills(resp.data);
            }

        } catch (err) {
            console.error("Error creating bill:", err.response?.data || err);
            const errorMessage = err.response?.data?.detail || 
                           Object.entries(err.response?.data || {})
                               .map(([key, value]) => `${key}: ${value}`)
                               .join(', ') || 
                           'Unknown error';
            setStatusMessage(`Failed to create bill: ${errorMessage}`);
        }
    };


    const BillsTable = ({ billsData, onBillClick = null }) => {
        if (!billsData || billsData.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">No bills found.</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VOUCHER NO.</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIPTION</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EXPENSE TYPE</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SUB-HEAD</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMAGE</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {billsData.map((bill) => {
                                const categoryName = bill.category_name || (categories.find(cat => cat.id === bill.category)?.title) || 'N/A';
                                const subcategoryName = bill.subcategory_name || (subcategories.find(subcat => subcat.id === bill.subcategory)?.title) || 'N/A';
                                
                                return (
                                    <tr 
                                        key={bill.id} 
                                        className={`hover:bg-gray-50 ${onBillClick ? 'cursor-pointer' : ''}`}
                                        onClick={onBillClick ? () => onBillClick(bill) : undefined}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(bill.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {bill.voucher_no}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            PKR {parseFloat(bill.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {bill.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {categoryName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {subcategoryName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {bill.bill_image ? (
                                                <a
                                                    href={bill.bill_image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-900"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const BillCard = ({ bill, detailed = false }) => {
        // Use the new, more efficient category_name and subcategory_name fields if they exist
        const categoryName = bill.category_name || (categories.find(cat => cat.id === bill.category)?.title) || 'N/A';
        const subcategoryName = bill.subcategory_name || (subcategories.find(subcat => subcat.id === bill.subcategory)?.title) || 'N/A';

        return (
            <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${!detailed ? 'cursor-pointer' : ''}`} onClick={!detailed ? () => handleViewBill(bill) : null}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
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

                {detailed && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M16 16h.01"></path>
                                </svg>
                                <div>
                                    <p className="text-gray-500">Voucher Number</p>
                                    <p className="font-medium text-gray-900">{bill.voucher_no}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"></path>
                                </svg>
                                <div>
                                    <p className="text-gray-500">Expense Type</p>
                                    <p className="font-medium text-gray-900">{categoryName}</p>
                                </div>
                            </div>
                            {bill.description && (
                                <div className="flex items-center col-span-1 sm:col-span-2">
                                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    <div>
                                        <p className="text-gray-500">Description</p>
                                        <p className="font-medium text-gray-900">{bill.description}</p>
                                    </div>
                                </div>
                            )}
                            {subcategoryName && (
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                                    </svg>
                                    <div>
                                        <p className="text-gray-500">Sub-Head</p>
                                        <p className="font-medium text-gray-900">{subcategoryName}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <div>
                                    <p className="text-gray-500">Approved By</p>
                                </div>
                            </div>
                        </div>
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
                    </>
                )}
            </div>
        );
    };

    const renderBillCreationForm = () => {
        if (!isCreatingBill) return null;

        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                        <h1 className="text-4xl font-extrabold text-white">Create New Bill</h1>
                    </div>
                    <form onSubmit={submitNewBill} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="month_id" className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                                <select
                                    id="month_id"
                                    name="month_id"
                                    value={newBillFormData.month_id}
                                    onChange={handleNewBillFormChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Month</option>
                                    {monthlyExpenses.map(month => (
                                        <option key={month.id} value={month.id}>{month.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={newBillFormData.date}
                                    onChange={handleNewBillFormChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="voucher_no" className="block text-sm font-medium text-gray-700 mb-1">Voucher No. *</label>
                                <input
                                    type="text"
                                    id="voucher_no"
                                    name="voucher_no"
                                    value={newBillFormData.voucher_no}
                                    onChange={handleNewBillFormChange}
                                    placeholder="e.g., 0001"
                                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={newBillFormData.amount}
                                    onChange={handleNewBillFormChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="3"
                                    value={newBillFormData.description}
                                    onChange={handleNewBillFormChange}
                                    placeholder="Enter detailed description of the expense"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="expense_type" className="block text-sm font-medium text-gray-700 mb-1">Expense Type (Head) *</label>
                                <select
                                    id="expense_type"
                                    name="expense_type"
                                    value={newBillFormData.expense_type}
                                    onChange={handleNewBillFormChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a Head</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700 mb-1">Sub-Head *</label>
                                <select
                                    id="subcategory_id"
                                    name="subcategory_id"
                                    value={newBillFormData.subcategory_id}
                                    onChange={handleNewBillFormChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={!newBillFormData.expense_type}
                                >
                                    <option value="">Select a Sub-Head</option>
                                    {subcategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="approved_by" className="block text-sm font-medium text-gray-700 mb-1">Approved By *</label>
                                <input
                                    type="text"
                                    id="approved_by"
                                    name="approved_by"
                                    value={newBillFormData.approved_by}
                                    onChange={handleNewBillFormChange}
                                    placeholder="Enter name of approver"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="bill_image" className="block text-sm font-medium text-gray-700 mb-1">Bill Image</label>
                            <input
                                type="file"
                                id="bill_image"
                                name="bill_image"
                                onChange={handleBillImageChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Add Bill
                        </button>
                        {statusMessage && (
                            <p className={`mt-4 text-center text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                {statusMessage}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <div className="text-center p-8 text-lg text-neutral-600">Loading {view}...</div>;
        if (error) return <div className="text-center p-8 text-lg text-red-600 font-semibold">{error}</div>;

        if (isCreatingBill) {
            return renderBillCreationForm();
        }

        switch (view) {
            case 'dailyExpenses':
                const dailyExpensesTotalCount = dailyExpenses.length + 1; // +1 for the Add New button
                const dailyBoxSize = getBoxSizeClasses(dailyExpenses.length);
                
                return (
                    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-4xl">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white tracking-wide transform transition-all duration-300 hover:scale-105">
                                    Daily Expenses
                                </h1>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {/* Add New Yearly Sheet */}
                                <div onClick={() => {
                                    const title = prompt('Enter yearly sheet title (e.g., "June-2025 to June-2026"):');
                                    if (title) {
                                        setNewExpenseTitle(title);
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
                                }} className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${dailyBoxSize}`} >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New Yearly Sheet</p>
                                </div>
                                {/* Existing Yearly Sheets */}
                                {dailyExpenses.length > 0 && (
                                    dailyExpenses.map((expense) => (
                                        <div key={expense.id} onClick={() => handleSelectDailyExpense(expense.id)} className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${dailyBoxSize}`} >
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{expense.title}</h3>
                                            <p className="text-gray-500 text-sm text-center">Rs {expense.total_amount ? expense.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}</p>
                                        </div>
                                    ))
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
            case 'monthlyExpenses':
                const monthlyBoxSize = "w-[140px] h-[100px] sm:w-[160px] sm:h-[120px]"; // Smaller size for mobile
                
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-6 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Monthly Expenses</h1>
                            </div>

                            {/* Add Monthly Expenses Section */}
                            <div className="mb-6 overflow-x-auto">
                                <div className="flex gap-3 p-2 min-w-min">
                                    {/* Add New Monthly Expense */}
                                    <div
                                        className={`bg-white rounded-xl shadow-lg p-3 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center flex-shrink-0 ${monthlyBoxSize}`}
                                        onClick={async () => {
                                            const title = prompt('Enter month name (e.g., "January"):');
                                            if (title) {
                                                try {
                                                    await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`, { title });
                                                    setStatusMessage('Monthly expense created successfully!');
                                                    fetchData(); // Refresh the list
                                                } catch (err) {
                                                    setStatusMessage('Failed to create monthly expense.');
                                                    console.error("Error creating monthly expense:", err);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 font-medium text-center text-xs sm:text-sm">Add New Month</p>
                                    </div>

                                    {/* Existing Monthly Expenses */}
                                    {monthlyExpenses.map((month) => (
                                        <div
                                            key={month.id}
                                            onClick={() => handleSelectMonthlyExpense(month.id)} // Changed from fetchBillsForMonth to handleSelectMonthlyExpense
                                            className={`bg-white rounded-xl shadow-lg p-3 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center flex-shrink-0 ${monthlyBoxSize}`}
                                        >
                                            <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-1">{month.title}</h3>
                                            <p className="text-gray-500 text-xs sm:text-sm">
                                                Rs {month.total_amount ? month.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Month Filter */}
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Month Filter:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={handleShowAllBills}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                                    selectedFilterMonth === null
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                All
                                            </button>
                                            {monthlyExpenses.map((month) => (
                                                <button
                                                    key={month.id}
                                                    onClick={() => handleQuickMonthFilter(month.id)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                                        selectedFilterMonth === month.id
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {month.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Create Bill Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <h2 className="text-lg font-semibold text-gray-900">Add New Bill</h2>
                                    </div>
                                    <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Click to expand the form</p>
                                <button
                                    onClick={() => {
                                        if (monthlyExpenses.length > 0) {
                                            setIsCreatingBill(true);
                                            setBillCreationStep('selectMonth');
                                        } else {
                                            setStatusMessage('Please create a monthly expense first to add bills.');
                                        }
                                    }}
                                    className="w-full bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 py-3 flex items-center justify-center space-x-2"
                                >
                                    <span>Create New Bill</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                            </div>

                            {/* Bills History */}
                            <div className="bg-white rounded-xl shadow-lg">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Bills History</h2>
                                </div>
                                <div className="p-6">
                                    <BillsTable billsData={allProjectBills} onBillClick={handleViewBill} />
                                </div>
                            </div>
                        </div>

                        {/* Show search results if any */}
                        {voucherSearchQuery && voucherSearchResults.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
                                <BillsTable billsData={voucherSearchResults} onBillClick={handleViewBill} />
                            </div>
                        )}
                    </div>
                );
            case 'billActions':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Bill Actions</h1>
                            </div>
                            <p className="text-lg text-gray-700 mb-6 text-center">
                                Choose an action to perform with bills.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                <div
                                    onClick={() => {
                                        if (monthlyExpenses.length > 0) {
                                            setIsCreatingBill(true);
                                            setBillCreationStep('selectMonth');
                                        } else {
                                            setStatusMessage('Please create a monthly expense first to add bills.');
                                        }
                                    }}
                                    className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center min-h-[200px]"
                                >
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-semibold text-center text-lg">Create New Bill</p>
                                </div>
                                <div
                                    onClick={fetchAllProjectBills}
                                    className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center min-h-[200px]"
                                >
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-semibold text-center text-lg">View All Bills</p>
                                </div>
                            </div>
                            {statusMessage && (
                                <p className={`mt-4 text-center text-sm font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                                    {statusMessage}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'allBillsMonths':
                const allBillsMonthsBoxSize = getBoxSizeClasses(monthlyExpenses.length);
                
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Select a Month</h1>
                            </div>
                            <p className="text-lg text-gray-700 mb-6 text-center">
                                Select a month to view all its bills.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {monthlyExpenses.length > 0 ? (
                                    monthlyExpenses.map((month) => (
                                        <div 
                                            key={month.id} 
                                            onClick={() => fetchBillsForMonth(month.id)} 
                                            className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${allBillsMonthsBoxSize}`}
                                        >
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">
                                                {month.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm text-center">
                                                Rs {month.total_amount ? month.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
                                        <p className="text-gray-500">No monthly expenses found for this yearly sheet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'categories':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Categories</h1>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Add new category button */}
                                <div 
                                    onClick={async () => {
                                        const title = prompt('Enter category name:');
                                        if (title) {
                                            try {
                                                await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/`, { title });
                                                setStatusMessage('Category created successfully!');
                                                fetchData();
                                            } catch (err) {
                                                setStatusMessage('Failed to create category.');
                                                console.error("Error creating category:", err);
                                            }
                                        }
                                    }}
                                    className="bg-white rounded-[25px] shadow-sm hover:shadow-md transition-all duration-200 aspect-square border border-dashed border-gray-200 cursor-pointer flex flex-col items-center justify-center p-6"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center">Add New Head Expense</p>
                                </div>

                                {/* List categories */}
                                {categories.map((category) => (
                                    <div 
                                        key={category.id} 
                                        onClick={() => handleSelectCategory(category.id)} 
                                        className="bg-white rounded-[25px] shadow-sm hover:shadow-md transition-all duration-200 aspect-square cursor-pointer flex flex-col items-center justify-center p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.title}</h3>
                                        <p className="text-2xl font-bold text-gray-900">Rs {category.total_amount ? category.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'subcategories':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">SubCategories</h1>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Add new subcategory button */}
                                <div 
                                    onClick={() => {
                                        const title = prompt('Enter subcategory name (e.g., "CNG"):');
                                        if (title) {
                                            setNewSubCategoryTitle(title);
                                            const submitForm = async () => {
                                                setStatusMessage('');
                                                try {
                                                    await axiosPrivate.post(`projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedIds.monthId}/categories/${selectedIds.categoryId}/subcategories/`, { title });
                                                    setStatusMessage('SubCategory created successfully!');
                                                    setNewSubCategoryTitle('');
                                                    fetchData();
                                                } catch (err) {
                                                    setStatusMessage('Failed to create SubCategory.');
                                                    console.error("Error creating SubCategory:", err);
                                                }
                                            };
                                            submitForm();
                                        }
                                    }}
                                    className="bg-white rounded-[25px] shadow-sm hover:shadow-md transition-all duration-200 aspect-square border border-dashed border-gray-200 cursor-pointer flex flex-col items-center justify-center p-6"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center">Add New SubCategory</p>
                                </div>

                                {/* List subcategories */}
                                {subcategories.map((sub) => (
                                    <div 
                                        key={sub.id} 
                                        onClick={() => handleSelectSubCategory(sub.id)} 
                                        className="bg-white rounded-[25px] shadow-sm hover:shadow-md transition-all duration-200 aspect-square cursor-pointer flex flex-col items-center justify-center p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{sub.title}</h3>
                                        <p className="text-2xl font-bold text-gray-900">Rs {sub.total_amount ? sub.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'bills':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-6xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Bills</h1>
                            </div>
                            
                            {/* Add this new summary section */}
                            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-sm mb-1">Total Bills</p>
                                        <p className="text-2xl font-bold text-gray-900">{bills.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-500 text-sm mb-1">Total Amount</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            Rs {bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                                <div className="flex-1 w-full sm:w-auto relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by voucher number, description, expense type, or sub-head..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                        value={voucherSearchQuery}
                                        onChange={(e) => setVoucherSearchQuery(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') handleVoucherSearch();
                                        }}
                                    />
                                </div>
                                <div className="flex space-x-2 w-full sm:w-auto">
                                    <button onClick={handleVoucherSearch} className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
                                        Search
                                    </button>
                                    <button onClick={fetchAllProjectBills} className="flex-1 sm:flex-none px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200">
                                        View All
                                    </button>
                                </div>
                            </div>
                            
                            {voucherSearchQuery && (
                                <div className="mt-4">
                                    {voucherSearchLoading && <p className="text-gray-500">Searching...</p>}
                                    {voucherSearchError && <p className="text-red-500">{voucherSearchError}</p>}
                                    {voucherSearchResults.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
                                            <BillsTable billsData={voucherSearchResults} onBillClick={handleViewBill} />
                                        </div>
                                    )}
                                    {!voucherSearchLoading && !voucherSearchError && voucherSearchResults.length === 0 && (
                                        <p className="text-gray-500 mb-6">No results found.</p>
                                    )}
                                </div>
                            )}

                            <BillsTable billsData={bills} onBillClick={handleViewBill} />
                        </div>
                    </div>
                );
            case 'singleBillView':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Bill Details</h1>
                            </div>
                            <div className="space-y-6">
                                {selectedBill && <BillCard bill={selectedBill} detailed={true} />}
                            </div>
                        </div>
                    </div>
                );
            case 'allBills':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-6xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Bills for the Month</h1>
                            </div>
                            <BillsTable billsData={allProjectBills} onBillClick={handleViewBill} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Add this function after other handler functions, before renderContent
    const handleQuickMonthFilter = async (monthId) => {
        setSelectedFilterMonth(monthId);
        setLoading(true);
        try {
            const resp = await axiosPrivate.get(
                `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${monthId}/bills/`
            );
            setAllProjectBills(resp.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching bills for month:", err);
            setError('Failed to fetch bills for this month.');
            setLoading(false);
        }
    };

    // Add this function with the other handlers
    const handleShowAllBills = async () => {
        setSelectedFilterMonth(null);
        setLoading(true);
        try {
            // First get all months
            const monthsResp = await axiosPrivate.get(
                `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/`
            );
            
            // Then get bills for each month
            const allBillsPromises = monthsResp.data.map(month => 
                axiosPrivate.get(
                    `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${month.id}/bills/`
                )
            );
            
            const responses = await Promise.all(allBillsPromises);
            
            // Combine all bills into a single array
            const allBills = responses.reduce((acc, resp) => {
                return [...acc, ...(Array.isArray(resp.data) ? resp.data : [])];
                
            }, []);
            console.log('All fetched bills:', allBills);
            setAllProjectBills(allBills);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching all bills:", err);
            setError('Failed to fetch all bills.');
            setLoading(false);
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