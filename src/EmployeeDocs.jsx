// your_react_project/src/pages/EmployeeDocuments.jsx

import React, { useEffect, useState } from "react";
import axiosInstance from './axiosInstance'; // Ensure this path is correct relative to EmployeeDocuments.jsx

// Define base URL for images based on your Django setup
// From your provided data, media is served from https://employeemanagement.company/media/
// So, the base URL for the Django server is https://employeemanagement.company
const BASE_API_URL = 'https://employeemanagement.company';

// eslint-disable-next-line no-unused-vars
export default function EmployeeDocs({ employeeId, onBack, employeeName }) {
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoomedImage, setZoomedImage] = useState(null); // New state for zoomed image

    // Fetches documents for the given employeeId
    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            // This URL pattern comes from your project.urls: profiles/<int:profile_id>/documents/
            const response = await axiosInstance.get(`/profiles/${employeeId}/documents/`);
            setDocuments(response.data);
        } catch (err) {
            console.error("Error fetching documents:", err.response ? err.response.data : err.message);
            setError("Failed to fetch documents.");
        } finally {
            setLoading(false);
        }
    };

    // Fetches documents when the component mounts or employeeId changes
    useEffect(() => {
        if (employeeId) {
            fetchDocuments();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);

    // Handler for image click to zoom
    const handleImageClick = (imageUrl) => {
        setZoomedImage(imageUrl);
    };

    // Handler to close the zoomed image
    const handleCloseZoom = () => {
        setZoomedImage(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-screen bg-gray-50">
                <p className="text-gray-600">Loading documents...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans antialiased">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-3 px-4 shadow-sm flex items-center justify-start relative">
                <button
                    onClick={onBack}
                    className="text-blue-500 text-lg font-normal flex items-center active:text-blue-700 transition-colors duration-200"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back
                </button>
                <h1 className="text-xl font-semibold text-gray-800 text-center absolute left-1/2 -translate-x-1/2">
                    Documents
                </h1>

            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                        {error}
                    </div>
                )}

                {documents.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No documents uploaded for this employee yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                                <div className="relative w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={`${BASE_API_URL}${doc.document_image}`}
                                        alt={doc.caption || "Employee Document"}
                                        className="object-cover w-full h-full cursor-pointer transition-transform duration-300 hover:scale-105"
                                        onClick={() => handleImageClick(`${BASE_API_URL}${doc.document_image}`)}
                                    />
                                </div>
                                <div className="p-3">
                                    <p className="text-gray-800 text-sm font-medium truncate mb-1">
                                        {doc.caption || "No Caption"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Zoomed Image Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseZoom}
                >
                    {/* stopPropagation so clicking inside the centered box doesn't close */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {/* inline-block wrapper so close button is positioned relative to the image */}
                        <div className="relative inline-block bg-transparent p-2 rounded-md">
                            <img
                                src={zoomedImage}
                                alt="Zoomed Document"
                                // Reduced max sizes so the image appears medium rather than extremely large
                                className="object-contain max-w-[60vw] max-h-[70vh] rounded-md shadow-lg"
                            />
                            {/* Close button positioned relative to the image (top-right of image) */}
                            <button
                                onClick={handleCloseZoom}
                                className="absolute -top-2 -right-2 bg-white bg-opacity-90 rounded-full p-2 text-gray-800 hover:bg-opacity-100 transition-colors duration-200 shadow-md"
                                aria-label="Close"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}