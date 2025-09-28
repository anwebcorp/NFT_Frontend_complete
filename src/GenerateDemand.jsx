import React, { useState } from 'react';
import axiosInstance from './axiosInstance';

export default function GenerateDemand({ onBack }) {
    const [demandData, setDemandData] = useState({
        title: '',
        description: '', // Renamed for clarity and to match models.py
        department: '', // Renamed to match models.py
        quotation_amount: '', // Renamed to match models.py
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            const file = files[0];
            setDemandData(prevState => ({
                ...prevState,
                image: file
            }));
            if (file) {
                setImagePreview(URL.createObjectURL(file));
            } else {
                setImagePreview(null);
            }
        } else {
            setDemandData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setStatus('');

        const formData = new FormData();
        formData.append('title', demandData.title);
        formData.append('description', demandData.description);
        formData.append('department', demandData.department);
        formData.append('quotation_amount', demandData.quotation_amount);
        if (demandData.image) {
            formData.append('image', demandData.image);
        }

        try {
            const response = await axiosInstance.post('/demands/create/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer YOUR_GENERATOR_TOKEN`
                }
            });
            console.log('Demand created:', response.data);
            setStatus('Demand successfully created!');
            setDemandData({
                title: '',
                description: '',
                department: '',
                quotation_amount: '',
                image: null
            });
            setImagePreview(null);
            setLoading(false);
            onBack();
        } catch (err) {
            console.error('Error creating demand:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to create demand. Please try again.';
            setError(`Error: ${errorMessage}`);
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center p-6 bg-neutral-50 min-h-screen font-sans">
            <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-xl border border-neutral-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-neutral-800">Generate New Demand</h2>
                    <button
                        onClick={onBack}
                        className="text-neutral-500 hover:text-neutral-800 transition-colors"
                        aria-label="Back to dashboard"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                {status && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{status}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-neutral-700 text-sm font-bold mb-2">Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={demandData.title}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="department" className="block text-neutral-700 text-sm font-bold mb-2">Department</label>
                                    <input
                                        type="text"
                                        id="department"
                                        name="department"
                                        value={demandData.department}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="quotation_amount" className="block text-neutral-700 text-sm font-bold mb-2">Quotation Amount</label>
                                    <input
                                        type="number"
                                        id="quotation_amount"
                                        name="quotation_amount"
                                        value={demandData.quotation_amount}
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="image" className="block text-neutral-700 text-sm font-bold mb-2">Upload Image</label>
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        onChange={handleChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        accept="image/*"
                                    />
                                    {imagePreview && (
                                        <div className="mt-4">
                                            <p className="text-sm font-semibold text-neutral-600 mb-2">Image Preview:</p>
                                            <img src={imagePreview} alt="Image Preview" className="max-w-full h-auto rounded-lg shadow-md border border-neutral-300" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-neutral-700 text-sm font-bold mb-2">Details</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={demandData.description}
                                        onChange={handleChange}
                                        rows="4"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            {loading ? 'Submitting...' : 'Submit Demand'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}