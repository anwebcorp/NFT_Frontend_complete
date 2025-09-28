import React, { useEffect, useState } from "react";
import axiosInstance from './axiosInstance'; // Ensure this path is correct relative to EmployeeDocuments.jsx

// Define base URL for images based on your Django setup
const BASE_API_URL = 'https://employeemanagement.company';

// eslint-disable-next-line no-unused-vars
export default function EmployeeDocuments({ employeeId, onBack, employeeName, readOnly }) {
    const [documents, setDocuments] = useState([]);
    const [newDocument, setNewDocument] = useState({ file: null, caption: "" });
    const [editingDocId, setEditingDocId] = useState(null);
    const [editingCaption, setEditingCaption] = useState("");
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoomedImage, setZoomedImage] = useState(null); // New state for zoomed image

    // Fetches documents for the given employeeId
    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
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

    // Handles automatic clearing of success/error messages
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 3000); // Messages disappear after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    // Handles file input change for new document upload
    const handleFileChange = (e) => {
        setNewDocument({ ...newDocument, file: e.target.files[0] });
    };

    // Handles caption input change for new document upload
    const handleCaptionChange = (e) => {
        setNewDocument({ ...newDocument, caption: e.target.value });
    };

    // Handles the upload of a new document
    const handleUploadDocument = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!newDocument.file) {
            setError("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("profile", employeeId); // 'profile' field is required by serializer
        formData.append("document_image", newDocument.file);
        if (newDocument.caption) {
            formData.append("caption", newDocument.caption);
        }

        try {
            await axiosInstance.post(`/profiles/${employeeId}/documents/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Essential for file uploads
                },
            });
            setSuccessMessage("Document uploaded successfully!");
            setNewDocument({ file: null, caption: "" }); // Clear form fields
            fetchDocuments(); // Refresh the list of documents
        } catch (err) {
            console.error("Error uploading document:", err.response ? err.response.data : err.message);
            setError("Failed to upload document.");
        }
    };

    // Sets the document to be edited (by ID) and its current caption
    const handleEditClick = (doc) => {
        setEditingDocId(doc.id);
        setEditingCaption(doc.caption);
    };

    // Cancels the editing mode
    const handleCancelEdit = () => {
        setEditingDocId(null);
        setEditingCaption("");
    };

    // Handles updating an existing document's caption
    const handleUpdateDocument = async (docId) => {
        setError(null);
        setSuccessMessage(null);
        try {
            await axiosInstance.put(`/documents/${docId}/`, { caption: editingCaption });
            setSuccessMessage("Document updated successfully!");
            setEditingDocId(null);
            setEditingCaption("");
            fetchDocuments(); // Refresh the list of documents
        } catch (err) {
            console.error("Error updating document:", err.response ? err.response.data : err.message);
            setError("Failed to update document.");
        }
    };

    // Handles deleting a document
    const handleDeleteDocument = async (docId) => {
        setError(null);
        setSuccessMessage(null);
        if (window.confirm("Are you sure you want to delete this document?")) {
            try {
                await axiosInstance.delete(`/documents/${docId}/`);
                setSuccessMessage("Document deleted successfully!");
                fetchDocuments(); // Refresh the list of documents
            } catch (err) {
                console.error("Error deleting document:", err.response ? err.response.data : err.message);
                setError("Failed to delete document.");
            }
        }
    };

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
                {/* Employee Name for ReadOnly view or general display */}
               
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                        {error}
                    </div>
                )}

                {!readOnly && (
                    <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Upload New Document</h3>
                        <form onSubmit={handleUploadDocument} className="space-y-4">
                            <div>
                                <label htmlFor="documentFile" className="block text-gray-700 text-sm font-medium mb-1">
                                    Select Document Image:
                                </label>
                                <input
                                    type="file"
                                    id="documentFile"
                                    onChange={handleFileChange}
                                    // iPhone-like file input styling
                                    className="block w-full text-sm text-gray-500
                                               file:mr-4 file:py-2 file:px-4
                                               file:rounded-md file:border-0
                                               file:text-sm file:font-semibold
                                               file:bg-blue-50 file:text-blue-700
                                               hover:file:bg-blue-100 file:active:bg-blue-200"
                                    accept="image/*"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="caption" className="block text-gray-700 text-sm font-medium mb-1">
                                    Caption (Optional):
                                </label>
                                <input
                                    type="text"
                                    id="caption"
                                    value={newDocument.caption}
                                    onChange={handleCaptionChange}
                                    placeholder="e.g., CNIC Front, Matric Certificate"
                                    // iPhone-like text input styling
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400
                                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                // iPhone-like primary button styling
                                className="w-full bg-blue-500 text-white font-medium py-2 rounded-lg
                                           active:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                Upload Document
                            </button>
                        </form>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">{readOnly ? "All Documents" : "Existing Documents"}</h3>
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
                                        {editingDocId === doc.id && !readOnly ? (
                                            <div className="w-full">
                                                <input
                                                    type="text"
                                                    value={editingCaption}
                                                    onChange={(e) => setEditingCaption(e.target.value)}
                                                    // iPhone-like text input styling
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400
                                                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2"
                                                />
                                                <div className="flex justify-between space-x-2">
                                                    <button
                                                        onClick={() => handleUpdateDocument(doc.id)}
                                                        // iPhone-like subtle action button styling
                                                        className="flex-1 text-blue-500 font-medium py-1 px-3 rounded-lg
                                                                   active:text-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        // iPhone-like subtle action button styling (secondary)
                                                        className="flex-1 text-gray-500 font-medium py-1 px-3 rounded-lg
                                                                   active:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-800 text-sm font-medium truncate mb-1">
                                                {doc.caption || "No Caption"}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </p>
                                        {!readOnly && editingDocId !== doc.id && (
                                            <div className="flex space-x-2 w-full justify-center mt-3">
                                                <button
                                                    onClick={() => handleEditClick(doc)}
                                                    // iPhone-like subtle action button styling
                                                    className="flex-1 text-blue-500 font-medium py-1 px-3 rounded-lg
                                                               active:text-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    // iPhone-like destructive button styling
                                                    className="flex-1 text-red-500 font-medium py-1 px-3 rounded-lg
                                                               active:text-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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