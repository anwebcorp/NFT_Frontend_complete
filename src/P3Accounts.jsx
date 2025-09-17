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
            const resp = await axiosPrivate.get(
                `projects/${projectId}/bills/search/?search=${encodeURIComponent(voucherSearchQuery)}`
            );
            setVoucherSearchResults(resp.data);
            setVoucherSearchLoading(false);
        } catch (err) {
            setVoucherSearchError('Voucher search failed.');
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

    // New useEffect to fetch categories for the bill creation form
    useEffect(() => {
        const fetchCategoriesForBill = async () => {
            if (isCreatingBill && billCreationStep === 'enterDetails' && selectedMonthForBill) {
                try {
                    const url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedMonthForBill}/categories/`;
                    const response = await axiosPrivate.get(url);
                    setCategories(response.data);
                } catch (err) {
                    console.error("Failed to fetch categories for bill creation:", err);
                    setStatusMessage('Failed to load categories for bill creation.');
                }
            }
        };
        fetchCategoriesForBill();
    }, [isCreatingBill, billCreationStep, selectedMonthForBill]);

    // New useEffect to fetch subcategories when a category is selected in the bill form
    useEffect(() => {
        const fetchSubcategories = async () => {
            const { expense_type } = newBillFormData; // Updated to use expense_type
            if (expense_type) {
                try {
                    const url = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedMonthForBill}/categories/${expense_type}/subcategories/`;
                    const response = await axiosPrivate.get(url);
                    setSubcategories(response.data);
                } catch (err) {
                    console.error("Failed to fetch subcategories:", err);
                    setStatusMessage('Failed to load subcategories.');
                }
            } else {
                setSubcategories([]);
            }
        };
        fetchSubcategories();
    }, [newBillFormData.expense_type]); // Updated dependency

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
            // If in bill creation flow, handle steps back
            if (billCreationStep === 'enterDetails') {
                setBillCreationStep('selectMonth');
                setSelectedMonthForBill(null);
            } else { // 'selectMonth'
                setIsCreatingBill(false);
                setBillCreationStep('selectMonth'); // Reset for next time
                setSelectedMonthForBill(null);
                setNewBillFormData({ // Clear form data
                    voucher_no: '', date: '', amount: '', description: '',
                    expense_type: '', subcategory_id: '', approved_by: ''
                });
                setBillImage(null);
            }
            return; // Exit here if handled by bill creation back
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
                setBills([]); // Clear bills when going back
                break;
            case 'singleBillView':
                if (bills.length > 0) {
                    setView('bills');
                } else {
                    setView('allBills');
                }
                setSelectedBill(null);
                break;
            case 'allBills':
                setView('allBillsMonths');
                setAllProjectBills([]); // Clear bills when going back
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

    const handleNewBillFormChange = (e) => {
        const { name, value } = e.target;
        setNewBillFormData(prev => ({ ...prev, [name]: value }));
        // If category changes, reset subcategory
        if (name === 'expense_type') {
            setNewBillFormData(prev => ({ ...prev, subcategory_id: '' }));
        }
    };

    const handleBillImageChange = (e) => {
        setBillImage(e.target.files[0]);
    };

    const submitNewBill = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        if (!selectedIds.dailyExpenseId || !selectedMonthForBill) {
            setStatusMessage('Error: Daily expense or month not selected.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('voucher_no', newBillFormData.voucher_no);
            formData.append('date', newBillFormData.date);
            formData.append('amount', newBillFormData.amount);
            formData.append('description', newBillFormData.description);
            formData.append('month_id', selectedMonthForBill);
            formData.append('category_id', newBillFormData.expense_type);
            formData.append('subcategory_id', newBillFormData.subcategory_id);
            formData.append('approved_by', newBillFormData.approved_by);

            if (billImage) {
                formData.append('bill_image', billImage);
            }

            // Debug logging
            console.log('Submitting bill with data:', {
                voucher_no: newBillFormData.voucher_no,
                date: newBillFormData.date,
                amount: newBillFormData.amount,
                description: newBillFormData.description,
                month_id: selectedMonthForBill,
                category_id: newBillFormData.expense_type,
                subcategory_id: newBillFormData.subcategory_id,
                approved_by: newBillFormData.approved_by
            });

            const createBillUrl = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedMonthForBill}/bills/`;
            
            const response = await axiosPrivate.post(createBillUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Bill creation response:', response.data);

            // Remove this validation check since the backend already validates
            // if (!response.data.category || !response.data.subcategory) {
            //     throw new Error('Category or subcategory not saved properly');
            // }

            setStatusMessage('Bill created successfully!');
            
            // Reset form and state
            setIsCreatingBill(false);
            setBillCreationStep('selectMonth');
            setSelectedMonthForBill(null);
            setNewBillFormData({
                voucher_no: '',
                date: '',
                amount: '',
                description: '',
                expense_type: '',
                subcategory_id: '',
                approved_by: ''
            });
            setBillImage(null);

            // Refresh the data
            if (selectedIds.subcategoryId) {
                const subcategoryUrl = `projects/${projectId}/heads/${headId}/expenses/${selectedIds.dailyExpenseId}/months/${selectedMonthForBill}/categories/${newBillFormData.expense_type}/subcategories/`;
                const subcategoriesResponse = await axiosPrivate.get(subcategoryUrl);
                setSubcategories(subcategoriesResponse.data);
                
                // Also refresh the bills list
                const selectedSubcategory = subcategoriesResponse.data.find(sub => sub.id === selectedIds.subcategoryId);
                if (selectedSubcategory && selectedSubcategory.bills) {
                    setBills(selectedSubcategory.bills);
                }
            }

        } catch (err) {
            console.error("Error creating bill:", err.response?.data || err);
            const errorMessage = err.response?.data?.detail || err.response?.data || err.message || 'Unknown error';
            setStatusMessage(`Failed to create bill: ${errorMessage}`);
        }
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
                                    <p className="font-medium text-gray-900">{bill.approved_by}</p>
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

        if (billCreationStep === 'selectMonth') {
            const totalMonths = monthlyExpenses.length + 1; // +1 for the Add New button (not counted in actual sizing)
            const boxSize = getBoxSizeClasses(monthlyExpenses.length);

            return (
                <div className="min-h-screen bg-gray-50 p-4">
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                            <h1 className="text-4xl font-extrabold text-white">Select Month for Bill</h1>
                        </div>
                        <p className="text-lg text-gray-700 mb-6 text-center">
                            Choose the monthly expense sheet where you want to add the new bill.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {monthlyExpenses.length > 0 ? (
                                monthlyExpenses.map((month) => (
                                    <div
                                        key={month.id}
                                        onClick={() => handleSelectMonthForBill(month.id)}
                                        className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 ${boxSize} flex flex-col items-center justify-center`}
                                    >
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{month.title}</h3>
                                        <p className="text-gray-500 text-sm text-center">Rs {month.total_amount ? month.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
                                    <p className="text-gray-500">No monthly expenses found. Please create one first.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        } else if (billCreationStep === 'enterDetails') {
            const selectedMonthTitle = monthlyExpenses.find(m => m.id === selectedMonthForBill)?.title || 'Selected Month';

            return (
                <div className="min-h-screen bg-gray-50 p-4">
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                            <h1 className="text-4xl font-extrabold text-white">Create Bill for {selectedMonthTitle}</h1>
                        </div>
                        <form onSubmit={submitNewBill} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        }
        return null;
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
                const monthlyBoxSize = getBoxSizeClasses(monthlyExpenses.length);
                
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Monthly Expenses</h1>
                            </div>

                            {/* Action Controls Container */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-4 mb-8">
                                {/* Search Bar */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search voucher number..."
                                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={voucherSearchQuery}
                                        onChange={(e) => setVoucherSearchQuery(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleVoucherSearch();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleVoucherSearch}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* More Button */}
                                <button
                                    onClick={() => setView('billActions')}
                                    className="w-full bg-gray-600 text-white font-medium rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200 py-3 flex items-center justify-center space-x-2"
                                >
                                    <span>More Actions</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                            </div>

                            {/* Show search results if any */}
                            {voucherSearchQuery && voucherSearchResults.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Search Results</h3>
                                    <div className="space-y-4">
                                        {voucherSearchResults.map(bill => (
                                            <BillCard key={bill.id} bill={bill} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Monthly Expenses List */}
                            <div className="flex flex-wrap justify-center gap-3">
                                {/* Add New Monthly Expense */}
                                <div className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${monthlyBoxSize}`}
                                    onClick={() => {
                                        const title = prompt('Enter month name (e.g., "January"):');
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
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New Monthly Expense</p>
                                </div>

                                {/* Existing Monthly Expenses */}
                                {monthlyExpenses.length > 0 && (
                                    monthlyExpenses.map((month) => (
                                        <div key={month.id} onClick={() => handleSelectMonthlyExpense(month.id)} className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${monthlyBoxSize}`} >
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{month.title}</h3>
                                            <p className="text-gray-500 text-sm text-center">Rs {month.total_amount ? month.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
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
                const categoriesBoxSize = getBoxSizeClasses(categories.length);
                
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Categories</h1>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                {/* Add new category button */}
                                <div className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${categoriesBoxSize}`}
                                    onClick={() => {
                                        const title = prompt('Enter category name (e.g., "Fuel"):');
                                        if (title) {
                                            setNewCategoryTitle(title);
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
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New Category</p>
                                </div>

                                {/* List categories */}
                                {categories.length > 0 && (
                                    categories.map((category) => (
                                        <div key={category.id} onClick={() => handleSelectCategory(category.id)} className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${categoriesBoxSize}`} >
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{category.title}</h3>
                                            <p className="text-gray-500 text-sm text-center">Rs {category.total_amount ? category.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'subcategories':
                const subcategoriesBoxSize = getBoxSizeClasses(subcategories.length);
                
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">SubCategories</h1>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                {/* Add new subcategory button */}
                                <div className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${subcategoriesBoxSize}`}
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
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium text-center text-sm">Add New SubCategory</p>
                                </div>

                                {/* List subcategories */}
                                {subcategories.length > 0 && (
                                    subcategories.map((sub) => (
                                        <div key={sub.id} onClick={() => handleSelectSubCategory(sub.id)} className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col items-center justify-center ${subcategoriesBoxSize}`} >
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{sub.title}</h3>
                                            <p className="text-gray-500 text-sm text-center">Rs {sub.total_amount ? sub.total_amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'none'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'bills':
                return (
                    <div className="min-h-screen bg-gray-50 p-4">
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Bills</h1>
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
                                        <div className="space-y-4">
                                            {voucherSearchResults.map(bill => (
                                                <BillCard key={bill.id} bill={bill} />
                                            ))}
                                        </div>
                                    )}
                                    {!voucherSearchLoading && !voucherSearchError && voucherSearchResults.length === 0 && (
                                        <p className="text-gray-500">No results found.</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-6 mt-6">
                                {bills.length > 0 ? (
                                    bills.map(bill => (
                                        <BillCard key={bill.id} bill={bill} />
                                    ))
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
                                        <p className="text-gray-500">No bills found for this monthly expense.</p>
                                    </div>
                                )}
                            </div>
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
                        <div className="w-full max-w-4xl mx-auto">
                            <div className="bg-blue-600 p-4 rounded-xl shadow-md mb-10 text-center">
                                <h1 className="text-4xl font-extrabold text-white">Bills for the Month</h1>
                            </div>
                            <div className="space-y-4">
                                {allProjectBills.length > 0 ? (
                                    allProjectBills.map((bill) => (
                                        <div key={bill.id} onClick={() => handleViewBill(bill)} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800">Voucher: {bill.voucher_no}</h3>
                                                        <p className="text-sm text-gray-600">{new Date(bill.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Amount</p>
                                                    <p className="text-xl font-bold text-indigo-600">Rs {parseFloat(bill.amount).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-sm text-gray-600 line-clamp-2">
                                                {bill.description}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-lg">No bills found for this month.</p>
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