import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAxiosPrivate from './useAxiosPrivate';
import P2Accounts from './P2Accounts.jsx';
import P3Accounts from './P3Accounts.jsx';
import P4Accounts from './P4Accounts.jsx';
import P5Accounts from './P5Accounts.jsx';


const P1Accounts = () => {
    const [view, setView] = useState('projects');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedHeadId, setSelectedHeadId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const [selectedHeadType, setSelectedHeadType] = useState(null);
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosPrivate.get('projects/');
            setProjects(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch projects. Please ensure the backend is running and you are logged in.');
            setLoading(false);
            console.error("Error fetching projects:", err);
        }
    };

    useEffect(() => {
        if (view === 'projects') {
            fetchProjects();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        try {
            await axiosPrivate.post('projects/', { name: newProjectName });
            setStatusMessage('Project created successfully!');
            setNewProjectName('');
            fetchProjects();
        } catch (error) {
            setStatusMessage('Failed to create project. Please ensure you are logged in as an admin.');
            console.error("Error creating project:", error);
        }
    };

    const handleSelectProject = (projectId) => {
        setSelectedProjectId(projectId);
        setView('heads');
    };

    const handleSelectHead = (headId, headType) => {
        setSelectedHeadId(headId);
        setSelectedHeadType(headType);
        setView('details');
    };

    const handleBack = () => {
        setStatusMessage('');
        switch (view) {
            case 'heads':
                setSelectedProjectId(null);
                setView('projects');
                break;
            case 'details':
                setSelectedHeadId(null);
                setView('heads');
                break;
            case 'createProject':
                setView('projects');
                break;
            default:
                // Go back to the main admin dashboard from the projects list
                navigate('/admin');
                break;
        }
    };

    const renderContent = () => {
        if (view === 'createProject') {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Create Project
                            </button>
                        </form>
                        {statusMessage && (
                            <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
                                statusMessage.includes('Failed') 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                                {statusMessage}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (view === 'heads' && selectedProjectId) {
            return <P2Accounts projectId={selectedProjectId} onSelectHead={handleSelectHead} onBack={handleBack} />;
        }
        if (selectedHeadType === 'finance') {
        return <P4Accounts projectId={selectedProjectId} headId={selectedHeadId} onBack={handleBack} />;
    }
    if (selectedHeadType === 'supplier') {
        return <P5Accounts projectId={selectedProjectId} headId={selectedHeadId} onBack={handleBack} />;
    }

        if (view === 'details' && selectedProjectId && selectedHeadId) {
            return <P3Accounts projectId={selectedProjectId} headId={selectedHeadId} onBack={handleBack} />;
        }

        if (loading) return (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
        
        if (error) return (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
                <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p className="text-lg text-red-700 font-semibold">{error}</p>
                </div>
            </div>
        );

        return (
            <div className="px-4 py-6 md:px-8 md:py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Projects</h2>
                        <button
                            onClick={() => setView('createProject')}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:from-green-700 hover:to-green-800 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create New Project
                        </button>
                    </div>
                    
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {projects.map((project, index) => (
                                <div
                                    key={project.id}
                                    onClick={() => handleSelectProject(project.id)}
                                    className="group bg-white rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-xl hover:border-blue-200 transform hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                                </svg>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">{project.name}</h3>
                                        <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">Click to view heads</p>
                                    </div>
                                    <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
                            <p className="text-gray-500 mb-6">Get started by creating your first project</p>
                            <button
                                onClick={() => setView('createProject')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-[1.02] transition-all duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <div className="px-4 py-4 flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        {(view !== 'projects') && (
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/admin')}
                            className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
                            </svg>
                            <span className="hidden sm:inline">Admin Dashboard</span>
                            <span className="sm:hidden">Admin</span>
                        </button>
                    </div>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default P1Accounts;