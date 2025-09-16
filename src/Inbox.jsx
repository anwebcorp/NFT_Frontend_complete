import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';

// Define the usernames for each role
const RECOMMENDER_USERNAME = 'danial@512';
const APPROVER_USERNAME = 'GRasool799';
const FINANCE_USERNAME = 'fahad_ali90';
const GENERATOR_USERNAME = 'fiazstores123';
// ⭐ NEW: Add the username for the Normal Admin
const NORMAL_ADMIN_USERNAME = 'mnaveed09'; // REMINDER: Update this with the actual username

export default function Inbox({ onBack, currentUsername }) {
    const [demands, setDemands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [selectedDemand, setSelectedDemand] = useState(null);
    const [filter, setFilter] = useState('all');

    // Use a variable to determine the user's role based on the provided usernames
    const isGenerator = currentUsername === GENERATOR_USERNAME;
    const isRecommender = currentUsername === RECOMMENDER_USERNAME;
    const isApprover = currentUsername === APPROVER_USERNAME;
    const isFinance = currentUsername === FINANCE_USERNAME;
    // ⭐ NEW: Check for the Normal Admin role
    const isNormalAdmin = currentUsername === NORMAL_ADMIN_USERNAME;

    useEffect(() => {
        fetchDemands();
    }, []);

    const fetchDemands = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/demands/inbox/', {
                headers: {
                    Authorization: `Bearer YOUR_AUTH_TOKEN`
                }
            });
            setDemands(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching demands:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to fetch inbox. Please try again.';
            setError(`Error: ${errorMessage}`);
            setLoading(false);
        }
    };

    const updateStatus = async (demandId, newStatus, reason = '') => {
        try {
            const response = await axiosInstance.post('/demands/update-status/', {
                id: demandId,
                status: newStatus,
                reason: reason
            }, {
                headers: {
                    Authorization: `Bearer YOUR_AUTH_TOKEN`
                }
            });
            console.log('Status updated:', response.data);
            setStatusMessage(`Demand ${demandId} status updated to ${newStatus}.`);
            fetchDemands();
        } catch (err) {
            console.error('Error updating status:', err);
            const errorMessage = err.response?.data?.error || 'Failed to update status.';
            setStatusMessage(`Error: ${errorMessage}`);
        }
    };

    const formatAmount = (amount) => {
        if (amount === null || amount === undefined) {
            return 'N/A';
        }
        const numericAmount = parseFloat(amount);
        return numericAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const createdDate = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - createdDate) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) {
            return Math.floor(interval) + ' years ago';
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            return Math.floor(interval) + ' months ago';
        }
        interval = seconds / 86400;
        if (interval > 1) {
            return Math.floor(interval) + ' days ago';
        }
        interval = seconds / 3600;
        if (interval > 1) {
            return Math.floor(interval) + ' hours ago';
        }
        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + ' minutes ago';
        }
        return Math.floor(seconds) + ' seconds ago';
    };

    if (selectedDemand) {
        return (
            <div className="min-h-screen bg-neutral-100 font-sans text-neutral-800 p-4 md:p-8 flex flex-col">
                <div className="bg-white p-6 rounded-lg shadow-md flex-1 overflow-y-auto min-h-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-neutral-900">Demand Details</h2>
                        <button
                            onClick={() => setSelectedDemand(null)}
                            className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Back to Inbox
                        </button>
                    </div>

                    <p className="text-sm text-neutral-500 mb-6">Complete information about the demand request</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Material Name</p>
                                <div className="bg-white border border-neutral-300 rounded-md p-3 mt-1">
                                    <p className="text-lg font-medium text-neutral-800">{selectedDemand.title}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Quotation Amount</p>
                                <div className="bg-white border border-neutral-300 rounded-md p-3 mt-1">
                                    <p className="text-lg font-medium text-neutral-800">PKR {formatAmount(selectedDemand.quotation_amount)}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Department</p>
                                <div className="bg-white border border-neutral-300 rounded-md p-3 mt-1">
                                    <p className="text-lg font-medium text-neutral-800">{selectedDemand.department}</p>
                                </div>
                            </div>
                            {selectedDemand.image && (
                                <div>
                                    <p className="text-sm font-semibold text-neutral-600">Quotation Image</p>
                                    <div className="mt-1">
                                        <img src={selectedDemand.image} alt="Demand" className="max-w-full h-auto rounded-lg shadow-md border border-neutral-300" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Generated by</p>
                                <div className="bg-green-100 border border-green-200 rounded-md p-3 mt-1 flex items-center">
                                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                    <p className="text-lg font-medium text-green-800">{selectedDemand.created_by_username}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Recommended by</p>
                                {selectedDemand.recommended_by_username ? (
                                    <div className="bg-green-100 border border-green-200 rounded-md p-3 mt-1 flex items-center">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        <p className="text-lg font-medium text-green-800">{selectedDemand.recommended_by_username}</p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 border border-gray-200 rounded-md p-3 mt-1 flex items-center">
                                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-lg font-medium text-gray-500">Not Recommended</p>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Approved by</p>
                                {selectedDemand.approved_by_username ? (
                                    <div className="bg-green-100 border border-green-200 rounded-md p-3 mt-1 flex items-center">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        <p className="text-lg font-medium text-green-800">{selectedDemand.approved_by_username}</p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 border border-gray-200 rounded-md p-3 mt-1 flex items-center">
                                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-lg font-medium text-gray-500">Not Approved</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-neutral-600">Rejected by</p>
                                {selectedDemand.rejected_by_username ? (
                                    <div className="bg-red-100 border border-red-200 rounded-md p-3 mt-1 flex items-center">
                                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <div>
                                            <p className="text-lg font-medium text-red-800">{selectedDemand.rejected_by_username}</p>
                                            <p className="text-sm text-red-600">Reason: {selectedDemand.reason}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-100 border border-gray-200 rounded-md p-3 mt-1 flex items-center">
                                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-lg font-medium text-gray-500">Not Rejected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredDemands = demands.filter(demand => {
        // ⭐ UPDATED: Generator's and Normal Admin's view
        if (isGenerator || isNormalAdmin) {
            if (filter === 'all') {
                return true;
            }
            if (filter === 'pending') {
                return demand.status === 'generated' || demand.status === 'recommended' || demand.status === 'approved';
            }
            if (filter === 'complete') {
                return demand.status === 'payment_released';
            }
            if (filter === 'rejected') {
                return demand.status === 'rejected';
            }
        }

        // Recommender's view
        if (isRecommender) {
            if (filter === 'all') {
                return demand.status === 'generated' || 
                       (demand.recommended_by_username === currentUsername) ||
                       (demand.status === 'rejected' && demand.rejected_by_username === currentUsername);
            }
            if (filter === 'pending') {
                return demand.status === 'generated';
            }
            if (filter === 'recommended') {
                return demand.recommended_by_username === currentUsername && demand.status !== 'rejected';
            }
            if (filter === 'rejected') {
                return demand.status === 'rejected' && demand.rejected_by_username === currentUsername;
            }
        }

        // Approver's view
        if (isApprover) {
            if (filter === 'all') {
                return demand.status === 'recommended' ||
                       (demand.approved_by_username === currentUsername) ||
                       (demand.status === 'rejected' && demand.rejected_by_username === currentUsername);
            }
            if (filter === 'pending') {
                return demand.status === 'recommended';
            }
            if (filter === 'approved') {
                return demand.approved_by_username === currentUsername && demand.status !== 'rejected';
            }
            if (filter === 'rejected') {
                return demand.status === 'rejected' && demand.rejected_by_username === currentUsername;
            }
        }

        // Finance's view
        if (isFinance) {
            if (filter === 'all') {
                return demand.status === 'approved' || demand.status === 'payment_released';
            }
            if (filter === 'pending') {
                return demand.status === 'approved';
            }
            if (filter === 'complete') {
                return demand.status === 'payment_released';
            }
        }
        
        return false;
    });

    return (
        <div className="min-h-screen bg-neutral-100 font-sans text-neutral-800 relative flex flex-col">
            <div className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-start">
                <button
                    onClick={onBack}
                    className="text-blue-600 text-lg font-normal flex items-center active:text-blue-700"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back
                </button>
                <h1 className="text-xl font-semibold text-neutral-900 text-center absolute left-1/2 -translate-x-1/2">
                    Inbox
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">Your Inbox</h2>

                    <div className="mb-6 flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            All
                        </button>

                        {/* ⭐ UPDATED: Generator's and Normal Admin's buttons */}
                        {(isGenerator || isNormalAdmin) && (
                            <>
                                <button
                                    onClick={() => setFilter('pending')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setFilter('complete')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Complete (Payment Released)
                                </button>
                                <button
                                    onClick={() => setFilter('rejected')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Rejected
                                </button>
                            </>
                        )}
                        
                        {/* Recommender's buttons */}
                        {isRecommender && (
                            <>
                                <button
                                    onClick={() => setFilter('pending')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Pending (Generated)
                                </button>
                                <button
                                    onClick={() => setFilter('recommended')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'recommended' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Recommended
                                </button>
                                <button
                                    onClick={() => setFilter('rejected')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Rejected
                                </button>
                            </>
                        )}

                        {/* Approver's buttons */}
                        {isApprover && (
                            <>
                                <button
                                    onClick={() => setFilter('pending')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Pending (Recommended)
                                </button>
                                <button
                                    onClick={() => setFilter('approved')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Approved
                                </button>
                                <button
                                    onClick={() => setFilter('rejected')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Rejected
                                </button>
                            </>
                        )}
                        
                        {/* Finance's buttons */}
                        {isFinance && (
                            <>
                                <button
                                    onClick={() => setFilter('pending')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Pending (Approved)
                                </button>
                                <button
                                    onClick={() => setFilter('complete')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Complete (Payment Released)
                                </button>
                            </>
                        )}
                    </div>

                    {statusMessage && <p className="mb-4 text-sm text-green-600">{statusMessage}</p>}
                    
                    {filteredDemands.length === 0 ? (
                        <p className="text-neutral-500">Your inbox is empty for this view.</p>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2">
                            <ul className="space-y-4">
                                {filteredDemands.map(demand => (
                                    <li key={demand.id} className="p-4 border border-neutral-200 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    demand.status === 'generated' ? 'bg-yellow-100 text-yellow-700' :
                                                    demand.status === 'recommended' ? 'bg-indigo-100 text-indigo-700' :
                                                    demand.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    demand.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    demand.status === 'payment_released' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {demand.status.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-neutral-500">{formatTimeAgo(demand.created_at)}</span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedDemand(demand)} 
                                                className="bg-blue-600 text-white text-sm py-1 px-3 rounded-md hover:bg-blue-700"
                                            >
                                                See Detail
                                            </button>
                                        </div>
                                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">Your demand for {demand.title} is {demand.status}</h3>
                                        <p className="text-sm text-neutral-500">
                                            Amount: PKR {formatAmount(demand.quotation_amount)} | Department: {demand.department}
                                        </p>
                                        
                                        {demand.status === 'rejected' && (
                                            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                                                <p className="text-red-700 font-semibold">Rejected</p>
                                                <p className="text-red-600 text-sm mt-1">Reason: {demand.reason}</p>
                                                <p className="text-red-600 text-xs mt-1">Rejected by: {demand.rejected_by_username}</p>
                                            </div>
                                        )}
    
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {/* ⭐ UPDATED: Do not show buttons if the user is a generator OR normal admin. */}
                                            {(!isGenerator && !isNormalAdmin) && (
                                                <>
                                                    {isRecommender && demand.status === 'generated' && (
                                                        <>
                                                            <button onClick={() => updateStatus(demand.id, 'recommended')} className="bg-blue-500 text-white text-sm py-1 px-3 rounded-md hover:bg-blue-600">
                                                                Recommend
                                                            </button>
                                                            <button onClick={() => updateStatus(demand.id, 'rejected', prompt('Enter reason for rejection:'))} className="bg-red-500 text-white text-sm py-1 px-3 rounded-md hover:bg-red-600">
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {isApprover && demand.status === 'recommended' && (
                                                        <>
                                                            <button onClick={() => updateStatus(demand.id, 'approved')} className="bg-green-500 text-white text-sm py-1 px-3 rounded-md hover:bg-green-600">
                                                                Approve
                                                            </button>
                                                            <button onClick={() => updateStatus(demand.id, 'rejected', prompt('Enter reason for rejection:'))} className="bg-red-500 text-white text-sm py-1 px-3 rounded-md hover:bg-red-600">
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {isFinance && demand.status === 'approved' && (
                                                        <button onClick={() => updateStatus(demand.id, 'payment_released')} className="bg-purple-500 text-white text-sm py-1 px-3 rounded-md hover:bg-purple-600">
                                                            Release Payment
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}