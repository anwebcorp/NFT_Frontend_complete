/* eslint-disable no-unused-vars */
import React, { useCallback, useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';
import { useNavigate } from 'react-router-dom';

const Suppliers = ({ onBack }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for creating a new supplier
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({
        name: '',
        cnic: '',
        contact_number: '',
        user: {
            username: '',
            password: '',
            email: '',
            first_name: '',
            last_name: ''
        }
    });
    const [createError, setCreateError] = useState(null);
    const [createSuccess, setCreateSuccess] = useState(false);

    // State for editing a supplier
    const [showEditForm, setShowEditForm] = useState(false);
    const [currentSupplierToEdit, setCurrentSupplierToEdit] = useState(null);
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(false);

    // State for deleting a supplier
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // State for viewing supplier details
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [supplierToView, setSupplierToView] = useState(null);

    // State for handling image files
    const [newProfileImage, setNewProfileImage] = useState(null);
    const [editProfileImage, setEditProfileImage] = useState(null);
    const [removeProfileImageFlag, setRemoveProfileImageFlag] = useState(false);

    // States for payments functionality
    const [showPaymentsPage, setShowPaymentsPage] = useState(false);
    const [supplierForPayments, setSupplierForPayments] = useState(null);
    const [payments, setPayments] = useState([]);
    const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
    const [paymentsError, setPaymentsError] = useState(null);
    const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
    const [newPaymentData, setNewPaymentData] = useState({
        material_name: '',
        total_quantity: '',
        rate_per_unit: '',
        note: '',
    });
    const [billImageFile, setBillImageFile] = useState(null);
    const [addPaymentSuccess, setAddPaymentSuccess] = useState(false);
    const [addPaymentError, setAddPaymentError] = useState(null);

    // States for editing and deleting payments
    const [showEditPaymentForm, setShowEditPaymentForm] = useState(false);
    const [currentPaymentToEdit, setCurrentPaymentToEdit] = useState(null);
    const [editPaymentFile, setEditPaymentFile] = useState(null);
    const [removePaymentImageFlag, setRemovePaymentImageFlag] = useState(false);
    const [editPaymentSuccess, setEditPaymentSuccess] = useState(false);
    const [editPaymentError, setEditPaymentError] = useState(null);

    const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [deletePaymentSuccess, setDeletePaymentSuccess] = useState(false);
    const [deletePaymentError, setDeletePaymentError] = useState(null);

    // NEW States for handling payment transactions
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
    const [paymentForTransaction, setPaymentForTransaction] = useState(null);
    const [newTransactionData, setNewTransactionData] = useState({
        paid_by_company: '',
        note: '',
    });
    const [receiptImageFile, setReceiptImageFile] = useState(null);
    const [addTransactionSuccess, setAddTransactionSuccess] = useState(false);
    const [addTransactionError, setAddTransactionError] = useState(null);

    // NEW state for expanded transactions
    const [expandedPayments, setExpandedPayments] = useState({});

    // NEW: State for selected payment detail
    const [selectedPayment, setSelectedPayment] = useState(null);

    // NEW: State to control payment list visibility
    const [showPaymentList, setShowPaymentList] = useState(false);

    const navigate = useNavigate();

    const constructImageUrl = (path) => {
        if (path && typeof path === 'string' && path.startsWith('/')) {
            return `https://employeemanagement.company${path}`;
        }
        return path;
    };


    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('suppliers/');
            if (response.status === 200) {
                setSuppliers(response.data);
            } else {
                setError('Failed to fetch suppliers.');
            }
        } catch (err) {
            setError('Error fetching suppliers.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPayments = useCallback(async (supplierId) => {
        setIsPaymentsLoading(true);
        setPaymentsError(null);
        try {
            const response = await axiosInstance.get('payments/');
            if (response.status === 200) {
                const filteredPayments = response.data.filter(payment => payment.supplier === supplierId);
                setPayments(filteredPayments);
            } else {
                setPaymentsError('Failed to fetch payments.');
            }
        } catch (err) {
            setPaymentsError('Error fetching payments.');
            console.error(err);
        } finally {
            setIsPaymentsLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    // Handlers for creating a supplier
    const handleNewSupplierInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setNewProfileImage(files[0]);
        } else if (['username', 'password', 'email', 'first_name', 'last_name'].includes(name)) {
            setNewSupplierData(prevData => ({
                ...prevData,
                user: {
                    ...prevData.user,
                    [name]: value
                }
            }));
        } else {
            setNewSupplierData(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleCreateSupplierSubmit = async (e) => {
        e.preventDefault();
        setCreateError(null);
        setCreateSuccess(false);

        if (!newSupplierData.user.password) {
            setCreateError('Password is required.');
            return;
        }

        const formData = new FormData();
        formData.append('name', newSupplierData.name);
        formData.append('cnic', newSupplierData.cnic);
        formData.append('contact_number', newSupplierData.contact_number);

        if (newProfileImage) {
            formData.append('profile_image', newProfileImage);
        }

        formData.append('user.username', newSupplierData.user.username);
        formData.append('user.password', newSupplierData.user.password);
        formData.append('user.email', newSupplierData.user.email);
        formData.append('user.first_name', newSupplierData.user.first_name);
        formData.append('user.last_name', newSupplierData.user.last_name);

        try {
            const response = await axiosInstance.post('suppliers/create/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 201) {
                setCreateSuccess(true);
                setShowCreateForm(false);
                setNewSupplierData({
                    name: '',
                    cnic: '',
                    contact_number: '',
                    profile_image: null,
                    user: {
                        username: '',
                        password: '',
                        email: '',
                        first_name: '',
                        last_name: ''
                    }
                });
                setNewProfileImage(null);
                fetchSuppliers();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.user?.username || 'Failed to create supplier.';
            setCreateError(errorMsg);
            console.error(err);
        }
    };

    // Handlers for editing a supplier
    const handleEditClick = (supplier) => {
        setCurrentSupplierToEdit({
            ...supplier,
            user: { ...supplier.user, password: '' }
        });
        setEditProfileImage(null);
        setRemoveProfileImageFlag(false);
        setShowEditForm(true);
    };

    const handleEditSupplierInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setEditProfileImage(files[0]);
            setRemoveProfileImageFlag(false);
        } else if (['username', 'email', 'first_name', 'last_name', 'password'].includes(name)) {
            setCurrentSupplierToEdit(prevData => ({
                ...prevData,
                user: {
                    ...prevData.user,
                    [name]: value
                }
            }));
        } else {
            setCurrentSupplierToEdit(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleUpdateSupplierSubmit = async (e) => {
        e.preventDefault();
        setEditError(null);
        setEditSuccess(false);

        if (!currentSupplierToEdit || !currentSupplierToEdit.id) {
            setEditError('No supplier selected for editing.');
            return;
        }

        const formData = new FormData();
        formData.append('name', currentSupplierToEdit.name);
        formData.append('cnic', currentSupplierToEdit.cnic);
        formData.append('contact_number', currentSupplierToEdit.contact_number);

        if (editProfileImage) {
            formData.append('profile_image', editProfileImage);
        } else if (removeProfileImageFlag) {
            formData.append('profile_image', '');
        }

        formData.append('user.username', currentSupplierToEdit.user.username);
        formData.append('user.email', currentSupplierToEdit.user.email);
        formData.append('user.first_name', currentSupplierToEdit.user.first_name);
        formData.append('user.last_name', currentSupplierToEdit.user.last_name);

        if (currentSupplierToEdit.user.password) {
            formData.append('user.password', currentSupplierToEdit.user.password);
        }

        try {
            const response = await axiosInstance.patch(`suppliers/${currentSupplierToEdit.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 200) {
                setEditSuccess(true);
                setShowEditForm(false);
                setCurrentSupplierToEdit(null);
                setEditProfileImage(null);
                setRemoveProfileImageFlag(false);
                fetchSuppliers();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.user?.username || 'Failed to update supplier.';
            setEditError(errorMsg);
            console.error(err);
        }
    };

    // Handlers for deleting a supplier
    const handleDeleteClick = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!supplierToDelete) return;

        setDeleteError(null);
        setDeleteSuccess(false);

        try {
            const response = await axiosInstance.delete(`suppliers/${supplierToDelete.id}/`);
            if (response.status === 204) {
                setDeleteSuccess(true);
                fetchSuppliers();
            }
        } catch (err) {
            setDeleteError('Failed to delete supplier.');
            console.error(err);
        } finally {
            setShowDeleteModal(false);
            setSupplierToDelete(null);
        }
    };

    // Handler for viewing supplier details
    const handleViewDetails = (supplier) => {
        setSupplierToView(supplier);
        setShowDetailsModal(true);
    };

    // New handlers for payments
    const handleViewPaymentsClick = (supplier) => {
        setSupplierToView(null);
        setShowDetailsModal(false);
        setSupplierForPayments(supplier);
        fetchPayments(supplier.id);
        setShowPaymentsPage(true);
    };

    const handleNewPaymentChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setBillImageFile(files[0]);
        } else {
            setNewPaymentData(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleNewPaymentSubmit = async (e) => {
        e.preventDefault();
        setAddPaymentError(null);
        setAddPaymentSuccess(false);

        if (!supplierForPayments) return;

        const formData = new FormData();
        formData.append('supplier', supplierForPayments.id);
        formData.append('material_name', newPaymentData.material_name);
        formData.append('total_quantity', newPaymentData.total_quantity);
        formData.append('rate_per_unit', newPaymentData.rate_per_unit);
        formData.append('total_amount', (parseFloat(newPaymentData.total_quantity) * parseFloat(newPaymentData.rate_per_unit)).toFixed(2));
        formData.append('remaining_amount', (parseFloat(newPaymentData.total_quantity) * parseFloat(newPaymentData.rate_per_unit)).toFixed(2));
        formData.append('note', newPaymentData.note);
        if (billImageFile) {
            formData.append('bill_image', billImageFile);
        }

        try {
            const response = await axiosInstance.post('payments/create/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 201) {
                setAddPaymentSuccess(true);
                setShowAddPaymentForm(false);
                setNewPaymentData({
                    material_name: '',
                    total_quantity: '',
                    rate_per_unit: '',
                    note: '',
                });
                setBillImageFile(null);
                fetchPayments(supplierForPayments.id);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to create payment.';
            setAddPaymentError(errorMsg);
            console.error(err);
        }
    };

    // Handlers for editing a payment
    const handleEditPaymentClick = (payment) => {
        setCurrentPaymentToEdit(payment);
        setEditPaymentFile(null);
        setRemovePaymentImageFlag(false);
        setShowEditPaymentForm(true);
    };

    const handleEditPaymentChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setEditPaymentFile(files[0]);
            setRemovePaymentImageFlag(false);
        } else {
            setCurrentPaymentToEdit(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleUpdatePaymentSubmit = async (e) => {
        e.preventDefault();
        setEditPaymentError(null);
        setEditPaymentSuccess(false);

        if (!currentPaymentToEdit || !currentPaymentToEdit.id) {
            setEditPaymentError('No payment selected for editing.');
            return;
        }

        const formData = new FormData();
        formData.append('material_name', currentPaymentToEdit.material_name);
        formData.append('total_quantity', currentPaymentToEdit.total_quantity);
        formData.append('rate_per_unit', currentPaymentToEdit.rate_per_unit);
        formData.append('total_amount', (parseFloat(currentPaymentToEdit.total_quantity) * parseFloat(currentPaymentToEdit.rate_per_unit)).toFixed(2));
        formData.append('remaining_amount', (parseFloat(currentPaymentToEdit.total_quantity) * parseFloat(currentPaymentToEdit.rate_per_unit)).toFixed(2));
        formData.append('note', currentPaymentToEdit.note);

        if (editPaymentFile) {
            formData.append('bill_image', editPaymentFile);
        } else if (removePaymentImageFlag) {
            formData.append('bill_image', '');
        }

        try {
            const response = await axiosInstance.patch(`payments/${currentPaymentToEdit.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 200) {
                setEditPaymentSuccess(true);
                setShowEditPaymentForm(false);
                setCurrentPaymentToEdit(null);
                setEditPaymentFile(null);
                setRemovePaymentImageFlag(false);
                fetchPayments(supplierForPayments.id);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to update payment.';
            setEditPaymentError(errorMsg);
            console.error(err);
        }
    };

    // Handlers for deleting a payment
    const handleDeletePaymentClick = (payment) => {
        setPaymentToDelete(payment);
        setShowDeletePaymentModal(true);
    };

    const handleConfirmDeletePayment = async () => {
        if (!paymentToDelete) return;

        setDeletePaymentError(null);
        setDeletePaymentSuccess(false);

        try {
            const response = await axiosInstance.delete(`payments/${paymentToDelete.id}/`);
            if (response.status === 204) {
                setDeletePaymentSuccess(true);
                fetchPayments(supplierForPayments.id);
            }
        } catch (err) {
            setDeletePaymentError('Failed to delete payment.');
            console.error(err);
        } finally {
            setShowDeletePaymentModal(false);
            setPaymentToDelete(null);
        }
    };

    // NEW handlers for payment transactions
    const handlePayClick = (payment) => {
        setPaymentForTransaction(payment);
        setShowAddTransactionModal(true);
        setNewTransactionData({
            paid_by_company: '',
            note: '',
        });
        setReceiptImageFile(null);
    };

    const handleNewTransactionChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setReceiptImageFile(files[0]);
        } else {
            setNewTransactionData(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleNewTransactionSubmit = async (e) => {
        e.preventDefault();
        setAddTransactionError(null);
        setAddTransactionSuccess(false);

        if (!paymentForTransaction) return;

        const formData = new FormData();
        formData.append('paid_by_company', newTransactionData.paid_by_company);
        formData.append('note', newTransactionData.note);
        if (receiptImageFile) {
            formData.append('receipt_image', receiptImageFile);
        }

        try {
            const response = await axiosInstance.post(`payments/${paymentForTransaction.id}/transactions/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 201) {
                setAddTransactionSuccess(true);
                setShowAddTransactionModal(false);
                fetchPayments(supplierForPayments.id); // Refresh payments to show new transaction
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to add transaction.';
            setAddTransactionError(errorMsg);
            console.error(err);
        }
    };

    // Handler to toggle transaction view
    const toggleTransactions = (paymentId) => {
        setExpandedPayments(prev => ({
            ...prev,
            [paymentId]: !prev[paymentId],
        }));
    };

    // Render payment page if showPaymentsPage is true
    if (showPaymentsPage) {
        return (
            <div className="p-8 bg-gray-100 text-gray-900 min-h-screen">
                <header className="flex justify-between items-center mb-10">
                    <button
                        onClick={() => setShowPaymentsPage(false)}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Back to Suppliers</span>
                    </button>
                    {/* Heading: smaller, bolder, more compact */}
                    {/* Button: smaller, tighter, more professional */}
                    <button
                        onClick={() => setShowAddPaymentForm(true)}
                        className="px-4 py-1.5 bg-blue-600  text-white font-medium rounded border border-blue-700 shadow-sm hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        style={{ minWidth: 140 }}
                    >
                        + Add Payment
                    </button>
                </header>

                {/*addPaymentSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Payment created successfully!</div>}
                {addPaymentError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{addPaymentError}</div>}
                {editPaymentSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Payment updated successfully!</div>}
                {editPaymentError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{editPaymentError}</div>}
                {deletePaymentSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Payment deleted successfully!</div>}
                {deletePaymentError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{deletePaymentError}</div>}
                {addTransactionSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Transaction added successfully!</div>}
                {addTransactionError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{addTransactionError}</div>*/}

                {/* Add Payment Form Modal */}
                {showAddPaymentForm && supplierForPayments && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh] border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Payment for {supplierForPayments.name}</h2>
                            <form onSubmit={handleNewPaymentSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <input type="text" name="material_name" value={newPaymentData.material_name} onChange={handleNewPaymentChange} placeholder="Material Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="number" name="total_quantity" value={newPaymentData.total_quantity} onChange={handleNewPaymentChange} placeholder="Total Quantity" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="number" name="rate_per_unit" value={newPaymentData.rate_per_unit} onChange={handleNewPaymentChange} placeholder="Rate Per Unit" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="text" name="note" value={newPaymentData.note} onChange={handleNewPaymentChange} placeholder="Note" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Bill Image</label>
                                        <input type="file" name="bill_image" onChange={handleNewPaymentChange} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => setShowAddPaymentForm(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-300">Create Payment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Payment Form Modal */}
                {showEditPaymentForm && currentPaymentToEdit && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh] border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Payment for {currentPaymentToEdit.material_name}</h2>
                            <form onSubmit={handleUpdatePaymentSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <input type="text" name="material_name" value={currentPaymentToEdit.material_name} onChange={handleEditPaymentChange} placeholder="Material Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="number" name="total_quantity" value={currentPaymentToEdit.total_quantity} onChange={handleEditPaymentChange} placeholder="Total Quantity" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="number" name="rate_per_unit" value={currentPaymentToEdit.rate_per_unit} onChange={handleEditPaymentChange} placeholder="Rate Per Unit" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <input type="text" name="note" value={currentPaymentToEdit.note} onChange={handleEditPaymentChange} placeholder="Note" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Bill Image</label>
                                        <input type="file" name="bill_image" onChange={handleEditPaymentChange} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                                        {currentPaymentToEdit.bill_image && !removePaymentImageFlag && (
                                            <div className="mt-2 flex items-center space-x-3">
                                                <a href={constructImageUrl(currentPaymentToEdit.bill_image)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View Current Image</a>
                                                <button type="button" onClick={() => { setRemovePaymentImageFlag(true); setEditPaymentFile(null); }} className="text-red-600 text-sm hover:underline">Remove Image</button>
                                            </div>
                                        )}
                                        {removePaymentImageFlag && <p className="mt-1 text-sm text-red-600">Image will be removed on update.</p>}
                                        {editPaymentFile && <p className="mt-1 text-sm text-green-600">New image selected for upload.</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => { setShowEditPaymentForm(false); setCurrentPaymentToEdit(null); }} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors duration-300">Update Payment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Payment Confirmation Modal */}
                {showDeletePaymentModal && paymentToDelete && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
                            <p className="mb-6 text-gray-700">Are you sure you want to delete the payment for material <span className="font-semibold text-gray-900">**{paymentToDelete.material_name}**</span>?</p>
                            <div className="flex justify-end space-x-4">
                                <button onClick={() => setShowDeletePaymentModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                                <button onClick={handleConfirmDeletePayment} className="px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors duration-300">Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Transaction Form Modal */}
                {showAddTransactionModal && paymentForTransaction && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add Transaction for: <span className="font-semibold text-blue-600">{paymentForTransaction.material_name}</span></h2>
                                <button onClick={() => setShowAddTransactionModal(false)} className="text-gray-600 hover:text-gray-900 transition-colors duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleNewTransactionSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <input
                                        type="number"
                                        name="paid_by_company"
                                        value={newTransactionData.paid_by_company}
                                        onChange={handleNewTransactionChange}
                                        placeholder="Amount Paid"
                                        className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="note"
                                        value={newTransactionData.note}
                                        onChange={handleNewTransactionChange}
                                        placeholder="Transaction Note (Optional)"
                                        className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Receipt Image (Optional)</label>
                                        <input
                                            type="file"
                                            name="receipt_image"
                                            onChange={handleNewTransactionChange}
                                            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={() => setShowAddTransactionModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors duration-300">Add Transaction</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Button to show/hide payment list */}
                <div className="mb-4">
                    {!showPaymentList ? (
                        <button
                            onClick={() => setShowPaymentList(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition-colors"
                        >
                            Full list
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowPaymentList(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-400 transition-colors"
                        >
                            Hide list
                        </button>
                    )}
                </div>

                {/* Payment List UI: only visible if showPaymentList is true */}
                {showPaymentList && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Payments List</h2>
                        {/* Only the options (ul) are scrollable from the 3rd item */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-xl">
                            <ul
                                className="divide-y divide-gray-100"
                                style={{
                                    maxHeight: payments.length > 3 ? '12.5rem' : 'none', // scroll only if >3
                                    overflowY: payments.length > 3 ? 'auto' : 'visible',
                                    scrollbarWidth: 'thin'
                                }}
                            >
                                {payments.map(payment => (
                                    <li
                                        key={payment.id}
                                        className={`flex justify-between items-center px-5 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 ${selectedPayment && selectedPayment.id === payment.id ? 'bg-blue-100' : ''}`}
                                        onClick={() => setSelectedPayment(payment)}
                                    >
                                        <span className="font-medium text-gray-900">{payment.material_name}</span>
                                        <span className="text-xs text-gray-500">{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : ''}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Payment Detail UI: only visible when selected */}
                {selectedPayment && (
                    <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-md p-6 max-w-xl">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{selectedPayment.material_name} Details</h3>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="text-gray-500 hover:text-gray-800 text-xs"
                            >
                                Close
                            </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p><strong>Quantity:</strong> {selectedPayment.total_quantity}</p>
                            <p><strong>Rate:</strong> {selectedPayment.rate_per_unit}</p>
                            <p><strong>Total Amount:</strong> <span className="font-semibold text-gray-900">{selectedPayment.total_amount}</span></p>
                            <p><strong>Remaining:</strong> <span className="font-semibold text-red-600">{selectedPayment.remaining_amount}</span></p>
                            {selectedPayment.note && <p><strong>Note:</strong> {selectedPayment.note}</p>}
                            {selectedPayment.bill_image && (
                                <p><strong>Bill Image:</strong> <a href={constructImageUrl(selectedPayment.bill_image)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Bill</a></p>
                            )}
                            <p><strong>Date:</strong> {selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString() : ''}</p>
                            <span className={`inline-block mt-2 text-xs leading-5 font-semibold rounded-full px-3 py-1 ${selectedPayment.status === 'Paid' ? 'bg-green-100 text-green-800' : selectedPayment.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {selectedPayment.status}
                            </span>
                        </div>
                    </div>
                )}
                {/* Payments grid: only visible when no payment is selected */}
                {!selectedPayment && (
                    isPaymentsLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                    ) : payments.length > 0 ? (
                        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {payments.map(payment => (
                                    <div key={payment.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900">{payment.material_name}</h3>
                                                    <span className={`mt-1 inline-flex text-xs leading-5 font-semibold rounded-full px-3 py-1 ${payment.status === 'Paid' ? 'bg-green-100 text-green-800' : payment.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {payment.status}
                                                    </span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    {payment.status !== 'Paid' && (
                                                        <button onClick={() => handlePayClick(payment)} className="p-2 text-green-600 hover:text-green-700 rounded-full transition-colors duration-200">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleEditPaymentClick(payment)} className="p-2 text-indigo-600 hover:text-indigo-700 rounded-full transition-colors duration-200">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleDeletePaymentClick(payment)} className="p-2 text-red-600 hover:text-red-700 rounded-full transition-colors duration-200">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-700">
                                                <p><strong>Quantity:</strong> {payment.total_quantity}</p>
                                                <p><strong>Rate:</strong> {payment.rate_per_unit}</p>
                                                <p><strong>Total Amount:</strong> <span className="font-semibold text-gray-900">{payment.total_amount}</span></p>
                                                <p><strong>Remaining:</strong> <span className="font-semibold text-red-600">{payment.remaining_amount}</span></p>
                                                {payment.note && <p><strong>Note:</strong> {payment.note}</p>}
                                                {payment.bill_image && (
                                                    <p><strong>Bill Image:</strong> <a href={constructImageUrl(payment.bill_image)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Bill</a></p>
                                                )}
                                            </div>
                                            {payment.transactions.length > 0 && (
                                                <div className="mt-4 border-t pt-4">
                                                    <button onClick={() => toggleTransactions(payment.id)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                                                        {expandedPayments[payment.id] ? 'Hide Transactions' : 'View Transactions'} ({payment.transactions.length})
                                                    </button>
                                                    {expandedPayments[payment.id] && (
                                                        <div className="mt-3 space-y-3">
                                                            {payment.transactions.map(transaction => (
                                                                <div key={transaction.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                                                                    <div className="flex justify-between items-center text-sm font-medium">
                                                                        <p className="text-gray-900">Paid: <span className="font-bold">{transaction.paid_by_company}</span></p>
                                                                        <p className="text-gray-500">{new Date(transaction.paid_on).toLocaleDateString()}</p>
                                                                    </div>
                                                                    {transaction.note && <p className="text-sm text-gray-600 mt-1">Note: {transaction.note}</p>}
                                                                    {transaction.receipt_image && (
                                                                        <a href={constructImageUrl(transaction.receipt_image)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline mt-2 inline-block">View Receipt</a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-64 text-gray-500">
                            No payments found for this supplier.
                        </div>
                    )
                )}
            </div>
        );
    }


    return (
        <div className="p-8 bg-gray-100 text-gray-900 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Back</span>
                </button>
                {/* Heading: smaller, bolder, responsive */}
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-wide text-left sm:text-center flex-1">
                    Suppliers Management
                </h1>
                {/* Button: compact, professional, responsive */}
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-1.5 bg-blue-600 text-white font-medium rounded border border-blue-700 shadow-sm hover:bg-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    style={{ minWidth: 140 }}
                >
                    + Add Supplier
                </button>
            </header>

            {/* Success and Error Messages */}
            {/*createSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Supplier created successfully!</div>}
            {createError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{createError}</div>}
            {editSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Supplier updated successfully!</div>}
            {editError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{editError}</div>}
            {deleteSuccess && <div className="p-4 mb-6 text-sm text-green-800 bg-green-100 rounded-lg shadow-md">Supplier deleted successfully!</div>}
            {deleteError && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{deleteError}</div>}
            {error && <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 rounded-lg shadow-md">{error}</div>*/}

            {/* Conditional Rendering of Forms */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh] border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Supplier</h2>
                        <form onSubmit={handleCreateSupplierSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <input type="text" name="name" value={newSupplierData.name} onChange={handleNewSupplierInputChange} placeholder="Company Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="cnic" value={newSupplierData.cnic} onChange={handleNewSupplierInputChange} placeholder="CNIC" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="contact_number" value={newSupplierData.contact_number} onChange={handleNewSupplierInputChange} placeholder="Contact Number" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="username" value={newSupplierData.user.username} onChange={handleNewSupplierInputChange} placeholder="Username" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="password" name="password" value={newSupplierData.user.password} onChange={handleNewSupplierInputChange} placeholder="Password" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="email" name="email" value={newSupplierData.user.email} onChange={handleNewSupplierInputChange} placeholder="Email" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="first_name" value={newSupplierData.user.first_name} onChange={handleNewSupplierInputChange} placeholder="First Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <input type="text" name="last_name" value={newSupplierData.user.last_name} onChange={handleNewSupplierInputChange} placeholder="Last Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Profile Image</label>
                                    <input type="file" name="profile_image" onChange={handleNewSupplierInputChange} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-300">Create Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditForm && currentSupplierToEdit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh] border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Supplier</h2>
                        <form onSubmit={handleUpdateSupplierSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <input type="text" name="name" value={currentSupplierToEdit.name} onChange={handleEditSupplierInputChange} placeholder="Company Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="cnic" value={currentSupplierToEdit.cnic} onChange={handleEditSupplierInputChange} placeholder="CNIC" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="contact_number" value={currentSupplierToEdit.contact_number} onChange={handleEditSupplierInputChange} placeholder="Contact Number" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="username" value={currentSupplierToEdit.user.username} onChange={handleEditSupplierInputChange} placeholder="Username" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="email" name="email" value={currentSupplierToEdit.user.email} onChange={handleEditSupplierInputChange} placeholder="Email" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                <input type="text" name="first_name" value={currentSupplierToEdit.user.first_name} onChange={handleEditSupplierInputChange} placeholder="First Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <input type="text" name="last_name" value={currentSupplierToEdit.user.last_name} onChange={handleEditSupplierInputChange} placeholder="Last Name" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <input type="password" name="password" value={currentSupplierToEdit.user.password} onChange={handleEditSupplierInputChange} placeholder="New Password (leave blank to keep current)" className="bg-gray-200 text-gray-900 border-gray-300 border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Profile Image</label>
                                    <input type="file" name="profile_image" onChange={handleEditSupplierInputChange} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                                    {currentSupplierToEdit.profile_image_url && !removeProfileImageFlag && (
                                        <div className="mt-2 flex items-center space-x-3">
                                            <a href={constructImageUrl(currentSupplierToEdit.profile_image_url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">View Current Image</a>
                                            <button type="button" onClick={() => { setRemoveProfileImageFlag(true); setEditProfileImage(null); }} className="text-red-600 text-sm hover:underline">Remove Image</button>
                                        </div>
                                    )}
                                    {removeProfileImageFlag && <p className="mt-1 text-sm text-red-600">Image will be removed on update.</p>}
                                    {editProfileImage && <p className="mt-1 text-sm text-green-600">New image selected for upload.</p>}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button type="button" onClick={() => { setShowEditForm(false); setCurrentSupplierToEdit(null); }} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition-colors duration-300">Update Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && supplierToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
                        <p className="mb-6 text-gray-700">Are you sure you want to delete the supplier <span className="font-semibold text-gray-900">**{supplierToDelete.name}**</span>?</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Cancel</button>
                            <button onClick={handleConfirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors duration-300">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && supplierToView && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Supplier Details</h2>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-600 hover:text-gray-900 transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex flex-col items-center mb-6">
                            {supplierToView.profile_image_url ? (
                                <img src={constructImageUrl(supplierToView.profile_image_url)} alt="Profile" className="h-40 w-40 rounded-full object-cover mb-4 ring-2 ring-blue-500" />
                            ) : (
                                <div className="h-40 w-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-4 ring-2 ring-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-gray-900">{supplierToView.name}</h3>
                        </div>
                        <div className="space-y-3 text-gray-700">
                            <p><strong>Contact:</strong> {supplierToView.contact_number}</p>
                            <p><strong>CNIC:</strong> {supplierToView.cnic}</p>
                            <p><strong>Username:</strong> {supplierToView.user.username}</p>
                            <p><strong>Email:</strong> {supplierToView.user.email}</p>
                            <p><strong>First Name:</strong> {supplierToView.user.first_name}</p>
                            <p><strong>Last Name:</strong> {supplierToView.user.last_name}</p>
                        </div>
                        <div className="flex justify-end space-x-4 mt-8">
                            <button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-md hover:bg-gray-300 transition-colors duration-300">Close</button>
                            <button onClick={() => handleViewPaymentsClick(supplierToView)} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-300">View Payments</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Suppliers List */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                </div>
            ) : suppliers.length > 0 ? (
                /* This div is the container for the table and allows horizontal scrolling on small screens. */
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden overflow-x-auto border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company Name</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-gray-100 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {supplier.profile_image_url ? (
                                            <img src={constructImageUrl(supplier.profile_image_url)} alt="Profile" className="h-12 w-12 rounded-full object-cover ring-1 ring-blue-500" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <button onClick={() => handleViewDetails(supplier)} className="text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline">
                                            {supplier.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 space-x-3">
                                        <button onClick={() => handleEditClick(supplier)} className="text-indigo-600 hover:text-indigo-700 transition-colors duration-200">Edit</button>
                                        <button onClick={() => handleDeleteClick(supplier)} className="text-red-600 hover:text-red-700 transition-colors duration-200">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                    No suppliers found.
                </div>
            )}
        </div>
    );
};

export default Suppliers;