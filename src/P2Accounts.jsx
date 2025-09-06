/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

const HEAD_TYPE_OPTIONS = [
    { value: "daily_expense", label: "Daily Expense" },
    { value: "finance", label: "Finance" },
];

const P2Accounts = ({ projectId, onSelectHead, onBack }) => {
    const [heads, setHeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const axiosPrivate = useAxiosPrivate();

    // Add Head dialog state
    const [showAddHeadDialog, setShowAddHeadDialog] = useState(false);
    const [newHeadName, setNewHeadName] = useState('');
    const [newHeadFunction, setNewHeadFunction] = useState('daily_expense'); // Default is daily_expense

    const fetchHeads = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosPrivate.get(`projects/${projectId}/heads/`);
            setHeads(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch heads. Please ensure the backend is running and you are logged in.');
            setLoading(false);
            console.error("Error fetching heads:", err);
        }
    };

    useEffect(() => {
        if (!projectId) return;
        fetchHeads();
    }, [projectId, axiosPrivate]);

    // Add Head handler
    const handleAddHead = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/`, { name: newHeadName, type: newHeadFunction });
            setStatusMessage('Head created successfully!');
            setShowAddHeadDialog(false);
            setNewHeadName('');
            setNewHeadFunction('daily_expense');
            fetchHeads();
        } catch (err) {
            setStatusMessage('Failed to create head.');
            console.error("Error creating head:", err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-xl text-slate-700 font-semibold">Loading accounts...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Connection Error</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">{error}</p>
                <button
                    onClick={onBack}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    Back to Projects
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 md:mb-12 gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center px-4 sm:px-6 py-2 sm:py-3 text-slate-600 hover:text-blue-700 hover:bg-white/70 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm hover:shadow-md text-sm sm:text-base"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-semibold">Back</span>
                    </button>
                    <div className="text-center flex-1 order-first sm:order-none">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-1 sm:mb-2">
                            Account Management
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base md:text-lg font-medium px-2">Manage your financial accounts</p>
                    </div>
                    <div className="hidden sm:block w-20 md:w-40"></div>
                </div>

                {/* Add Head Button */}
                <div className="flex justify-center sm:justify-end mb-6 sm:mb-8 md:mb-12">
                    <button
                        onClick={() => setShowAddHeadDialog(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm sm:text-base w-full sm:w-auto max-w-xs sm:max-w-none"
                    >
                        <span className="flex items-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Account
                        </span>
                    </button>
                </div>

                {/* Add Head Dialog */}
                {showAddHeadDialog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-lg border border-slate-200 max-h-[90vh] overflow-y-auto">
                            <div className="text-center mb-6 sm:mb-8">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2">Create New Account</h2>
                                <p className="text-slate-600 text-sm sm:text-base md:text-lg px-2">Add a new financial account to your project</p>
                            </div>
                            <form onSubmit={handleAddHead} className="space-y-6 sm:space-y-8">
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Account Name</label>
                                    <input
                                        type="text"
                                        value={newHeadName}
                                        onChange={(e) => setNewHeadName(e.target.value)}
                                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white text-base sm:text-lg"
                                        placeholder="Enter account name..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">Account Type</label>
                                    <select
                                        value={newHeadFunction}
                                        onChange={(e) => setNewHeadFunction(e.target.value)}
                                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white text-base sm:text-lg"
                                    >
                                        {HEAD_TYPE_OPTIONS.map(option => (
                                            <option value={option.value} key={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddHeadDialog(false);
                                            setNewHeadName('');
                                            setNewHeadFunction('daily_expense');
                                        }}
                                        className="px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold transition-colors duration-200 text-base sm:text-lg order-2 sm:order-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 sm:px-10 py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-base sm:text-lg order-1 sm:order-2"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </form>
                            {statusMessage && (
                                <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center font-semibold text-sm sm:text-base md:text-lg ${
                                    statusMessage.includes('Failed') 
                                        ? 'bg-red-50 text-red-700 border-2 border-red-200' 
                                        : 'bg-green-50 text-green-700 border-2 border-green-200'
                                }`}>
                                    {statusMessage}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* All Heads Section */}
                <div className="mt-12">
                    <div className="text-center mb-8 sm:mb-10 md:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2 sm:mb-4">Account Overview</h2>
                        <p className="text-slate-600 text-sm sm:text-base md:text-xl px-4">Manage your financial accounts and daily expense tracking</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                        {heads.length > 0 ? (
                            heads.map((head) => (
                                <div
                                    key={head.id}
                                    onClick={() => onSelectHead(head.id, head.type)}
                                    className="group bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border-2 border-slate-200/50 p-4 sm:p-6 md:p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-3 hover:bg-white hover:border-blue-200"
                                >
                                    <div className="text-center">
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg ${
                                            head.type === "daily_expense" 
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                                                : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                        }`}>
                                            {head.type === "daily_expense" ? (
                                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            ) : (
                                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-3 sm:mb-4 group-hover:text-blue-700 transition-colors duration-200 px-2">{head.name}</h3>
                                        <div className={`inline-flex items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6 shadow-md ${
                                            head.type === "daily_expense" 
                                                ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-2 border-emerald-200" 
                                                : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-2 border-blue-200"
                                        }`}>
                                            {head.type === "daily_expense" && (
                                                <>
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    DAILY EXPENSE
                                                </>
                                            )}
                                            {head.type === "finance" && (
                                                <>
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    FINANCE
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-center text-blue-600 font-bold group-hover:text-blue-800 transition-colors duration-200 text-sm sm:text-base md:text-lg">
                                            <span>Manage Account</span>
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-1 sm:ml-2 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full">
                                <div className="text-center py-12 sm:py-16 md:py-24">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-700 mb-3 sm:mb-4 px-4">No Accounts Yet</h3>
                                    <p className="text-slate-500 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base md:text-lg leading-relaxed px-4">Get started by creating your first financial account or daily expense tracker using the button above.</p>
                                    <button
                                        onClick={() => setShowAddHeadDialog(true)}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 md:px-10 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 text-sm sm:text-base md:text-lg mx-4"
                                    >
                                        Create First Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default P2Accounts;