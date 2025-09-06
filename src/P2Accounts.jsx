/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import useAxiosPrivate from './useAxiosPrivate';

const P2Accounts = ({ projectId, onSelectHead, onBack }) => {
    const [heads, setHeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newHeadName, setNewHeadName] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const axiosPrivate = useAxiosPrivate();

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

    const handleCreateHead = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post(`projects/${projectId}/heads/`, { name: newHeadName });
            setStatusMessage('Head created successfully!');
            setNewHeadName('');
            fetchHeads();
        } catch (err) {
            setStatusMessage('Failed to create head.');
            console.error("Error creating head:", err);
        }
    };

    if (loading) return <div className="text-center p-4 sm:p-8 text-base sm:text-lg text-neutral-600">Loading heads...</div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 space-y-4 text-center min-h-screen">
            <p className="text-base sm:text-lg text-red-600 font-semibold px-4">{error}</p>
            <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800 transition-colors font-semibold mt-4 px-6 py-2 rounded-lg hover:bg-blue-50"
            >
                Back to Projects
            </button>
        </div>
    );

    const headColors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-pink-500',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans text-neutral-800 p-3 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 text-center sm:text-left">Select a Head</h2>
                    <button
                        onClick={onBack}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white text-gray-700 rounded-lg font-semibold shadow-sm hover:shadow-md border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                        ← Back
                    </button>
                </div>

                <form onSubmit={handleCreateHead} className="mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg font-bold">+</span>
                        </div>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Add New Head</h3>
                    </div>
                    <div className="mb-4 sm:mb-6">
                        <input
                            type="text"
                            value={newHeadName}
                            onChange={(e) => setNewHeadName(e.target.value)}
                            className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-gray-50 hover:bg-white"
                            placeholder="Enter head name..."
                            required
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-sm sm:text-base">
                        Create New Head
                    </button>
                    {statusMessage && <p className={`mt-3 sm:mt-4 text-center text-sm sm:text-base font-medium ${statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{statusMessage}</p>}
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {heads.length > 0 ? (
                        heads.map((head, index) => (
                            <div
                                key={head.id}
                                onClick={() => onSelectHead(head.id)}
                                className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-105 hover:border-blue-200 transition-all duration-300 group"
                            >
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                    <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${headColors[index % headColors.length]} shadow-sm group-hover:scale-110 transition-transform duration-200`}></span>
                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">{head.name}</h3>
                                </div>
                                <p className="text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3 group-hover:text-blue-600 transition-colors duration-200">Click to view details →</p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 sm:py-12">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl sm:text-3xl text-gray-400">📁</span>
                            </div>
                            <p className="text-gray-500 text-sm sm:text-base mb-2">No heads found</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Create your first head using the form above</p>
                        </div>
                    )}
                </div>

              
            </div>
        </div>
    );
};

export default P2Accounts;