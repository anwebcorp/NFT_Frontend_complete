import React, { useState, useEffect } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

function P5Accounts({ projectId, headId, onBack }) {
    // State for the main supplier list view
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');

    // State for the supplier details view
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [payments, setPayments] = useState([]);
    const [bills, setBills] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    // New states for creating payments and bills
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [newPaymentAmount, setNewPaymentAmount] = useState('');
    const [newPaymentDate, setNewPaymentDate] = useState('');
    const [newPaymentVoucher, setNewPaymentVoucher] = useState('');
    const [newPaymentDescription, setNewPaymentDescription] = useState('');
    const [newPaymentImage, setNewPaymentImage] = useState(null);
    const [newBillAmount, setNewBillAmount] = useState('');
    const [newBillDate, setNewBillDate] = useState('');
    const [newBillNo, setNewBillNo] = useState('');
    const [newBillDescription, setNewBillDescription] = useState('');

    const axiosPrivate = useAxiosPrivate();

    // Effect to fetch the list of suppliers
    const fetchSuppliers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosPrivate.get(`projects/${projectId}/heads/${headId}/suppliers/`);
            setSuppliers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch suppliers.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId && headId) {
            fetchSuppliers();
        }
    }, [projectId, headId, axiosPrivate]);

    // Effect to fetch details for the selected supplier
    const fetchSupplierDetails = async () => {
        if (!selectedSupplier) return;

        setDetailsLoading(true);
        setDetailsError(null);
        try {
            const paymentsResponse = await axiosPrivate.get(`suppliers/${selectedSupplier.id}/payments/`);
            setPayments(paymentsResponse.data);

            const billsResponse = await axiosPrivate.get(`suppliers/${selectedSupplier.id}/bills/`);
            setBills(billsResponse.data);

            setDetailsLoading(false);
        } catch (err) {
            setDetailsError('Failed to fetch supplier details.');
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplierDetails();
    }, [selectedSupplier, axiosPrivate]);

    // Function to handle creating a new supplier
    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/${headId}/suppliers/`, {
                name: newSupplierName,
                head: headId
            });
            fetchSuppliers();
            setNewSupplierName('');
            setShowSupplierModal(false);
        } catch (err) {
            setError('Failed to add supplier.');
        }
    };

    // New: Function to handle creating a new payment
    const handleCreatePayment = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('voucher_no', newPaymentVoucher);
            formData.append('amount', newPaymentAmount);
            formData.append('date', newPaymentDate);
            formData.append('description', newPaymentDescription);
            formData.append('supplier', selectedSupplier.id);
            formData.append('project', projectId);
            if (newPaymentImage) {
                formData.append('bill_image', newPaymentImage);
            }
    
            await axiosPrivate.post(`suppliers/${selectedSupplier.id}/payments/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            fetchSupplierDetails(); // Re-fetch details to update the lists
            fetchSuppliers(); // Re-fetch the main supplier list to update summary stats
            setShowPaymentModal(false);
            setNewPaymentVoucher('');
            setNewPaymentAmount('');
            setNewPaymentDate('');
            setNewPaymentDescription('');
            setNewPaymentImage(null);
        } catch (err) {
            console.error("Error creating payment:", err.response?.data);
            setDetailsError('Failed to create payment.');
        }
    };

    // New: Function to handle creating a new bill
    const handleCreateBill = async (e) => {
        e.preventDefault();
        try {
            await axiosPrivate.post(`suppliers/${selectedSupplier.id}/bills/`, {
                bill_no: newBillNo,
                amount: newBillAmount,
                date: newBillDate,
                description: newBillDescription,
                supplier: selectedSupplier.id,
                project: projectId,
            });
            fetchSupplierDetails(); // Re-fetch details to update the lists
            fetchSuppliers(); // Re-fetch the main supplier list to update summary stats
            setShowBillModal(false);
            setNewBillNo('');
            setNewBillAmount('');
            setNewBillDate('');
            setNewBillDescription('');
        } catch (err) {
            console.error("Error creating bill:", err.response?.data);
            setDetailsError('Failed to create bill.');
        }
    };

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        // Use a consistent format
        const formattedAmount = Number(amount).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });
        return formattedAmount.replace('PKR', 'Rs.');
    };

    // Function to determine the balance status string
    const getBalanceStatus = (balance) => {
        if (balance > 0) {
            return "The company has to pay the supplier.";
        } else if (balance < 0) {
            return "The supplier has to pay the company.";
        }
        return "Balance settled.";
    };

    // Combine payments and bills into a single sorted array for the transaction history
    const allTransactions = [...payments, ...bills]
        .map(item => ({
            ...item,
            type: item.voucher_no ? 'Payment' : 'Bill',
            transactionNo: item.voucher_no || item.bill_no,
            imageUrl: item.bill_image || null,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Conditional Rendering for Supplier Details View
    if (selectedSupplier) {
        return (
            <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedSupplier(null)} className="p-2 rounded-full hover:bg-neutral-200 transition-colors">
                        <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">{selectedSupplier.name}</h1>
                        <p className="text-neutral-600">Supplier Details & Transaction History</p>
                    </div>
                </div>

                {/* Create Buttons */}
                <div className="flex gap-4 mb-6">
                    <button onClick={() => setShowPaymentModal(true)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                        + Total paid by Company to Supplier
                    </button>
                    <button onClick={() => setShowBillModal(true)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                        + Total bills payed by Suppliers to Company
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Paid */}
                    <div className="bg-green-100 p-6 rounded-xl shadow-sm border border-green-300 flex items-center gap-4">
                        <div className="p-3 bg-green-200 rounded-full text-green-700">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.99 14.5a1 1 0 01-1.41-1.41A4.956 4.956 0 017 11c0-2.206 1.794-4 4-4s4 1.794 4 4a1 1 0 01-2 0c0-1.103-.897-2-2-2s-2 .897-2 2a2.986 2.986 0 002.99 3.5zm2.99 2a1 1 0 01-1.41 1.41 6.958 6.958 0 01-4.95-4.95 1 1 0 011.41-1.41A4.956 4.956 0 0012 15a4.956 4.956 0 003.54-1.46 1 1 0 011.41 1.41A6.958 6.958 0 0112 18.5z"></path></svg>
                        </div>
                        <div>
                            <p className="text-green-800 text-sm font-semibold">Total Paid</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(selectedSupplier.total_paid)}</p>
                        </div>
                    </div>
                    {/* Total Bills */}
                    <div className="bg-red-100 p-6 rounded-xl shadow-sm border border-red-300 flex items-center gap-4">
                        <div className="p-3 bg-red-200 rounded-full text-red-700">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15 2H9c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h6c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM9 4h6v2H9V4zm0 16v-2h6v2H9zM9 8h6v2H9V8zm0 4h6v2H9v-4z"></path></svg>
                        </div>
                        <div>
                            <p className="text-red-800 text-sm font-semibold">Total Bills</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(selectedSupplier.total_received)}</p>
                        </div>
                    </div>
                    {/* Advance Balance */}
                    <div className="bg-blue-100 p-6 rounded-xl shadow-sm border border-blue-300 flex items-center gap-4">
                        <div className="p-3 bg-blue-200 rounded-full text-blue-700">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm-1 2v2H5V6h14zm0 4v2H5v-2h14zm0 4v2H5v-2h14z"></path></svg>
                        </div>
                        <div>
                            <p className="text-blue-800 text-sm font-semibold">Current Balance</p>
                            <p className={`text-2xl font-bold mt-1 ${selectedSupplier.balance > 0 ? 'text-blue-900' : selectedSupplier.balance < 0 ? 'text-red-900' : 'text-neutral-900'}`}>
                                {formatCurrency(Math.abs(selectedSupplier.balance))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Balance Summary */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-neutral-800">Balance Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-y-0">
                        <div className="flex flex-col">
                            <span className="text-neutral-500 text-sm">Current Balance</span>
                            <span className={`text-4xl font-bold mt-1 ${selectedSupplier.balance > 0 ? 'text-blue-600' : selectedSupplier.balance < 0 ? 'text-red-600' : 'text-neutral-600'}`}>
                                {formatCurrency(Math.abs(selectedSupplier.balance))}
                            </span>
                            <span className="text-neutral-500 text-sm mt-1">
                                {getBalanceStatus(selectedSupplier.balance)}
                            </span>
                        </div>
                        <div className="flex flex-col justify-end">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-neutral-600">Total Payments:</span>
                                <span className="font-medium text-green-600">{formatCurrency(selectedSupplier.total_paid)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-600">Total Bills:</span>
                                <span className="font-medium text-red-600">{formatCurrency(selectedSupplier.total_received)}</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Transaction History Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-xl font-semibold mb-4 text-neutral-800">Transaction History</h2>
                    {allTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">DATE</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">TYPE</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">AMOUNT</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">VOUCHER/BILL</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">DESCRIPTION</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">DOCUMENT</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-200">
                                    {allTransactions.map((transaction, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{transaction.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    transaction.type === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatCurrency(transaction.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{transaction.transactionNo}</td>
                                            <td className="px-6 py-4 text-sm text-neutral-900">{transaction.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {transaction.imageUrl ? (
                                                    <a href={transaction.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                        View Image
                                                    </a>
                                                ) : (
                                                    <span className="text-neutral-500">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-neutral-500">No transactions found.</p>
                    )}
                </div>

                {/* Create Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h2 className="text-2xl font-bold mb-4">Add New Payment</h2>
                            <form onSubmit={handleCreatePayment}>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Voucher No</label>
                                    <input type="text" value={newPaymentVoucher} onChange={(e) => setNewPaymentVoucher(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Amount</label>
                                    <input type="number" step="0.01" value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Date</label>
                                    <input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Description</label>
                                    <textarea value={newPaymentDescription} onChange={(e) => setNewPaymentDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Document Image</label>
                                    <input type="file" onChange={(e) => setNewPaymentImage(e.target.files[0])} className="w-full text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium">Add Payment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Bill Modal */}
                {showBillModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                            <h2 className="text-2xl font-bold mb-4">Add New Bill</h2>
                            <form onSubmit={handleCreateBill}>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Bill No</label>
                                    <input type="text" value={newBillNo} onChange={(e) => setNewBillNo(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Amount</label>
                                    <input type="number" step="0.01" value={newBillAmount} onChange={(e) => setNewBillAmount(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Date</label>
                                    <input type="date" value={newBillDate} onChange={(e) => setNewBillDate(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-neutral-700 font-medium mb-2">Description</label>
                                    <textarea value={newBillDescription} onChange={(e) => setNewBillDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowBillModal(false)} className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium">Add Bill</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Default return for the main Supplier List View
    return (
        <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-neutral-900">Suppliers</h1>
                    <p className="text-neutral-600 mt-1">Manage your supplier payments and bills</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                    </div>
                    <button
                        className="flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                        onClick={() => setShowSupplierModal(true)}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Supplier
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Supplier Card */}
                <button
                    onClick={() => setShowSupplierModal(true)}
                    className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 cursor-pointer hover:bg-neutral-100 transition-colors"
                >
                    <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-800 text-lg">Create New Supplier</h3>
                    <p className="text-center text-sm mt-1">Add a new supplier to manage payments and bills</p>
                </button>
            
                {loading && <p className="col-span-full text-center">Loading suppliers...</p>}
                {error && <p className="col-span-full text-center text-red-500">{error}</p>}
            
                {!loading && !error && filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                        <div 
                            key={supplier.id} 
                            onClick={() => setSelectedSupplier(supplier)} 
                            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15 2H9c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h6c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM9 4h6v2H9V4zm0 16v-2h6v2H9zM9 8h6v2H9V8zm0 4h6v2H9v-4z"></path>
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-lg text-neutral-900">{supplier.name}</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-600 text-sm">Total Paid</span>
                                    <span className="text-sm font-semibold text-green-600">{formatCurrency(supplier.total_paid)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-600 text-sm">Total Bill</span>
                                    <span className="text-sm font-semibold text-red-600">{formatCurrency(supplier.total_received)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                                    <span className="text-neutral-600 text-sm">Balance</span>
                                    <span className={`text-sm font-semibold ${supplier.balance > 0 ? 'text-blue-600' : supplier.balance < 0 ? 'text-red-600' : 'text-neutral-600'}`}>
                                        {formatCurrency(Math.abs(supplier.balance))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && !error && (
                        <div className="col-span-full flex items-center justify-center p-12 text-center text-neutral-500">
                            <p>No suppliers found matching your search.</p>
                        </div>
                    )
                )}
            </div>

            {/* Modal for adding a new supplier */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-neutral-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all scale-100 duration-300">
                        <h3 className="text-2xl font-bold text-neutral-900 mb-6">Add New Supplier</h3>
                        <form onSubmit={handleAddSupplier}>
                            <div className="mb-4">
                                <label htmlFor="supplier-name" className="block text-sm font-medium text-neutral-700 mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    id="supplier-name"
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSupplierModal(false)}
                                    className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default P5Accounts;