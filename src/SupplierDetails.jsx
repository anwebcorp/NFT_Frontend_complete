
import React, { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';

const SupplierDetails = () => {
    const { supplierId } = useParams();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [paymentsPerPage] = useState(3);
    const [pageNumberLimit] = useState(3);
    const [maxPageLimit, setMaxPageLimit] = useState(3);
    const [minPageLimit, setMinPageLimit] = useState(0);

    const constructImageUrl = (path) => {
        if (path && typeof path === 'string' && path.startsWith('/')) {
            return `http://127.0.0.1:8000${path}`;
        }
        return path;
    };

    const fetchSupplierDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`suppliers/${supplierId}/`);
            if (response.status === 200) {
                setSupplier(response.data);

                // Corrected API call to fetch payments for the specific supplier
                const paymentsResponse = await axiosInstance.get(`payments/?supplier=${supplierId}`);
                if (paymentsResponse.status === 200) {
                    setPayments(paymentsResponse.data);
                }
            } else {
                setError('Failed to fetch supplier details.');
            }
        } catch (err) {
            setError('Error fetching supplier details or payments.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [supplierId]);

    useEffect(() => {
        fetchSupplierDetails();
    }, [fetchSupplierDetails]);

    // Get current payments for the page
    const indexOfLastPayment = currentPage * paymentsPerPage;
    const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
    const currentPayments = payments.slice(indexOfFirstPayment, indexOfLastPayment);

    // Calculate total pages
    const totalPages = Math.ceil(payments.length / paymentsPerPage);

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleNextBtn = () => {
        setCurrentPage(prev => prev + 1);
        if (currentPage + 1 > maxPageLimit) {
            setMaxPageLimit(maxPageLimit + pageNumberLimit);
            setMinPageLimit(minPageLimit + pageNumberLimit);
        }
    };

    const handlePrevBtn = () => {
        setCurrentPage(prev => prev - 1);
        if ((currentPage - 1) % pageNumberLimit === 0 && currentPage !== 1) {
            setMaxPageLimit(maxPageLimit - pageNumberLimit);
            setMinPageLimit(minPageLimit - pageNumberLimit);
        }
    };

    const renderPageNumbers = pages.map(number => {
        if (number < maxPageLimit + 1 && number > minPageLimit) {
            return (
                <button
                    key={number}
                    onClick={() => handlePageClick(number)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        currentPage === number ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {number}
                </button>
            );
        } else {
            return null;
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-red-600 bg-red-100 rounded-lg shadow-md">{error}</div>;
    }

    if (!supplier) {
        return <div className="p-8 text-gray-600">Supplier not found.</div>;
    }

    return (
        <div className="p-8 bg-gray-100 min-h-screen text-gray-900">
            <header className="flex items-center mb-8">
                <button onClick={() => navigate('/suppliers')} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Suppliers
                </button>
            </header>

            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                    <div className="flex-shrink-0">
                        {supplier.profile_image_url ? (
                            <img src={constructImageUrl(supplier.profile_image_url)} alt="Profile" className="h-48 w-48 rounded-full object-cover ring-4 ring-blue-500" />
                        ) : (
                            <div className="h-48 w-48 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 ring-4 ring-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{supplier.name}</h1>
                        <p className="text-gray-600 text-lg mb-4">Supplier ID: {supplier.id}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <div className="space-y-2">
                                <p><strong>CNIC:</strong> {supplier.cnic}</p>
                                <p><strong>Contact:</strong> {supplier.contact_number}</p>
                                <p><strong>Email:</strong> {supplier.user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <p><strong>Username:</strong> {supplier.user.username}</p>
                                <p><strong>First Name:</strong> {supplier.user.first_name}</p>
                                <p><strong>Last Name:</strong> {supplier.user.last_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment History</h2>
                    {payments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentPayments.map((payment, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            <div className="mt-4 flex justify-center items-center space-x-2">
                                <button
                                    onClick={handlePrevBtn}
                                    disabled={currentPage === pages[0]}
                                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {renderPageNumbers}
                                <button
                                    onClick={handleNextBtn}
                                    disabled={currentPage === pages[pages.length - 1]}
                                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">No payment history found for this supplier.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupplierDetails;
