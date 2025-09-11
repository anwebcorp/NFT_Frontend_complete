import React, { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from './axiosInstance';
import json from "json-bigint";

import EmployeeDocuments from './EmployeeDocuments';
import PayAdmin from './PayAdmin';
import Attendance from './Attendance';
import Suppliers from "./Suppliers";

const DEFAULT_AVATAR_PLACEHOLDER = "https://placehold.co/150x150/CCCCCC/FFFFFF?text=NO+IMAGE";
const ADMIN_AVATAR_PLACEHOLDER = "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

// Memoize the PayAdmin component if it's not already memoized internally
// This assumes PayAdmin is a functional component that can be wrapped by React.memo
const MemoizedPayAdmin = memo(PayAdmin); // Wrap PayAdmin with memo

export default function Admin({ user, setUser }) {
    const [employees, setEmployees] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showComingSoon, setShowComingSoon] = useState(null);

    const [newEmployeeData, setNewEmployeeData] = useState({
        name: "", cnic: "", phone_number: "", address: "", Job_title: "",
        image: null, employee_id: "", joining_date: "",
        username: "", email: "", first_name: "", last_name: "", password: "",
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createEmployeeError, setCreateEmployeeError] = useState(null);
    const [createEmployeeSuccess, setCreateEmployeeSuccess] = useState(false);

    const [showEditForm, setShowEditForm] = useState(false);
    const [currentEmployeeToEdit, setCurrentEmployeeToEdit] = useState(null);
    const [editEmployeeError, setEditEmployeeError] = useState(null);
    const [editEmployeeSuccess, setEditEmployeeSuccess] = useState(false);

    const [showDocuments, setShowDocuments] = useState(false);
    const [employeeForDocuments, setEmployeeForDocuments] = useState(null);

    const [showDetailSubPage, setShowDetailSubPage] = useState(null);
    const [employeeForDetailSubPage, setEmployeeForDetailSubPage] = useState(null);

    const [showPaymentPage, setShowPaymentPage] = useState(false);
    const [employeeForPayment, setEmployeeForPayment] = useState(null);

    const [showAttendancePage, setShowAttendancePage] = useState(false);
    const [employeeForAttendance, setEmployeeForAttendance] = useState(null);

    const [showSuppliersPage, setShowSuppliersPage] = useState(false);

    const [showMenu, setShowMenu] = useState(false);

    const navigate = useNavigate();

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/employees/');
            if (response.data && response.data.length > 0) {
                localStorage.setItem("allProfiles", JSON.stringify(response.data));
                processAndSetEmployees(response.data);
                setError(null);
            } else {
                const storedProfiles = localStorage.getItem("allProfiles");
                if (storedProfiles) {
                    processAndSetEmployees(json.parse(storedProfiles));
                    setError(null);
                } else {
                    setError("No employee data found. Please log in again.");
                }
            }
        } catch (apiError) {
            console.error("Failed to fetch employees from API:", apiError);
            const storedProfiles = localStorage.getItem("allProfiles");
            if (storedProfiles) {
                try {
                    processAndSetEmployees(json.parse(storedProfiles));
                    setError("Failed to load employee data from server. Loaded from storage.");
                } catch (e) {
                    console.error("Failed to parse profiles from localStorage after API error:", e);
                    setError("Failed to load employee data from storage.");
                }
            } else {
                setError("No employee data found. Please log in again.");
            }
        }
    }, []);

    const processAndSetEmployees = (profiles) => {
        const ADMIN_ID = 18;
        const filteredEmployees = profiles.filter(
            (profile) => profile.id !== ADMIN_ID
        );

        const formattedEmployees = filteredEmployees.map((profile) => ({
            id: profile.id,
            name: profile.name,
            username: profile.user?.username || 'N/A',
            email: profile.user?.email || 'N/A',
            first_name: profile.user?.first_name || '',
            last_name: profile.user?.last_name || '',
            phone_number: profile.phone_number,
            address: profile.address || "N/A",
            cnic: profile.cnic || "N/A",
            employee_id: profile.employee_id || "N/A",
            joining_date: profile.joining_date || "N/A",
            time_since_joining: profile.time_since_joining || "N/A",
            Job_title: profile.Job_title || "N/A",
            photo: (profile.image && typeof profile.image === 'string' && profile.image.startsWith('/'))
                ? `https://employeemanagement.company${profile.image}`
                : DEFAULT_AVATAR_PLACEHOLDER,
        }));
        setEmployees(formattedEmployees);
    };

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        if (showComingSoon) {
            const timer = setTimeout(() => {
                setShowComingSoon(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showComingSoon]);

    useEffect(() => {
        if (createEmployeeSuccess || createEmployeeError) {
            const timer = setTimeout(() => {
                setCreateEmployeeSuccess(false);
                setCreateEmployeeError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [createEmployeeSuccess, createEmployeeError]);

    useEffect(() => {
        if (editEmployeeSuccess || editEmployeeError) {
            const timer = setTimeout(() => {
                setEditEmployeeSuccess(false);
                setEditEmployeeError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [editEmployeeSuccess, editEmployeeError]);

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("allProfiles");
        navigate("/login");
        setShowMenu(false);
    };

    const handleEmployeeClick = (employee) => {
        setSelectedEmployee(employee);
        setShowComingSoon(null);
        setShowDetailSubPage(null);
        setEmployeeForDetailSubPage(null);
        setShowPaymentPage(false);
        setEmployeeForPayment(null);
        setShowAttendancePage(false);
        setEmployeeForAttendance(null);
    };

    const handleBackFromEmployeeDetail = () => {
        setSelectedEmployee(null);
        setShowComingSoon(null);
        setShowDetailSubPage(null);
        setEmployeeForDetailSubPage(null);
    };

    // eslint-disable-next-line no-unused-vars
    const handleFeatureClick = (feature) => {
        setShowComingSoon(feature);
    };

    const handleManageDocumentsClick = (employee) => {
        setEmployeeForDocuments(employee);
        setShowDocuments(true);
        setSelectedEmployee(null);
        setShowDetailSubPage(null);
        setEmployeeForDetailSubPage(null);
        setShowPaymentPage(false);
        setEmployeeForPayment(null);
        setShowAttendancePage(false);
        setEmployeeForAttendance(null);
    };

    const handleBackFromDocuments = () => {
        setShowDocuments(false);
        setEmployeeForDocuments(null);
    };

    const handleDetailClick = (employee, detailKey) => {
        setEmployeeForDetailSubPage(employee);
        setShowDetailSubPage(detailKey);
        setSelectedEmployee(null);
        setShowPaymentPage(false);
        setEmployeeForPayment(null);
        setShowAttendancePage(false);
        setEmployeeForAttendance(null);
    };

    const handleBackFromDetailSubPage = () => {
        setShowDetailSubPage(null);
        setSelectedEmployee(employeeForDetailSubPage);
        setEmployeeForDetailSubPage(null);
    };

    const handleManagePaymentClick = useCallback((employee) => {
        setEmployeeForPayment(employee);
        setShowPaymentPage(true);
        setSelectedEmployee(null);
        setShowDocuments(false);
        setEmployeeForDocuments(null);
        setShowDetailSubPage(null);
        setEmployeeForDetailSubPage(null);
        setShowAttendancePage(false);
        setEmployeeForAttendance(null);
        setShowComingSoon(null);
    }, []);

    const handleBackFromPayment = useCallback(() => {
        setShowPaymentPage(false);
        setEmployeeForPayment(null);
    }, []);

    const handleManageAttendanceClick = useCallback((employee) => {
        setEmployeeForAttendance(employee);
        setShowAttendancePage(true);
        setSelectedEmployee(null);
        setShowDocuments(false);
        setEmployeeForDocuments(null);
        setShowDetailSubPage(null);
        setEmployeeForDetailSubPage(null);
        setShowPaymentPage(false);
        setEmployeeForPayment(null);
        setShowComingSoon(null);
    }, []);

    const handleBackFromAttendance = useCallback(() => {
        setShowAttendancePage(false);
        setEmployeeForAttendance(null);
        fetchEmployees();
    }, [fetchEmployees]);

    const handleManageSuppliersClick = useCallback(() => {
        setShowSuppliersPage(true);
        setSelectedEmployee(null);
        setShowDocuments(false);
        setEmployeeForDocuments(null);
        setShowDetailSubPage(null);
        setEmployeeForDetailSubPage(null);
        setShowPaymentPage(false);
        setEmployeeForPayment(null);
        setShowAttendancePage(false);
        setEmployeeForAttendance(null);
        setShowComingSoon(null);
        setShowMenu(false);
    }, []);

    const handleBackFromSuppliers = useCallback(() => {
        setShowSuppliersPage(false);
    }, []);

    const handleNewEmployeeInputChange = (e) => {
        const { name, value } = e.target;
        setNewEmployeeData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleNewEmployeeFileChange = (e) => {
        setNewEmployeeData((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleCreateEmployeeSubmit = async (e) => {
        e.preventDefault();
        setCreateEmployeeError(null);
        setCreateEmployeeSuccess(false);

        const formData = new FormData();
        for (const key in newEmployeeData) {
            if (newEmployeeData[key] !== null && ![
                'image', 'username', 'email', 'first_name', 'last_name', 'password'
            ].includes(key)) {
                formData.append(key, newEmployeeData[key]);
            }
        }

        if (newEmployeeData.image) {
            formData.append('image', newEmployeeData.image);
        }

        const userDetails = {
            username: newEmployeeData.username,
            email: newEmployeeData.email,
            first_name: newEmployeeData.first_name,
            last_name: newEmployeeData.last_name,
            password: newEmployeeData.password,
        };
        formData.append('user', JSON.stringify(userDetails));

        try {
            const response = await axiosInstance.post('/create-employee/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Employee created successfully:", response.data);
            setCreateEmployeeSuccess(true);
            setNewEmployeeData({
                name: "", cnic: "", phone_number: "", address: "", Job_title: "",
                image: null, employee_id: "", joining_date: "",
                username: "", email: "", first_name: "", last_name: "", password: ""
            });
            setShowCreateForm(false);
            fetchEmployees();

        } catch (error) {
            console.error("Error creating employee:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.detail || error.response?.data?.msg ||
                                Object.values(error.response?.data || {}).flat().join(' ') ||
                                "Unknown error occurred.";
            setCreateEmployeeError(`Failed to create employee: ${errorMessage}`);
        }
    };

    const handleEditEmployeeInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentEmployeeToEdit((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleEditEmployeeFileChange = (e) => {
        setCurrentEmployeeToEdit((prevData) => ({ ...prevData, image: e.target.files[0] }));
    };

    const handleUpdateEmployeeSubmit = async (e) => {
        e.preventDefault();
        setEditEmployeeError(null);
        setEditEmployeeSuccess(false);

        if (!currentEmployeeToEdit || !currentEmployeeToEdit.id) {
            setEditEmployeeError("No employee selected for editing.");
            return;
        }

        const formData = new FormData();
        for (const key in currentEmployeeToEdit) {
            if (currentEmployeeToEdit[key] !== null && currentEmployeeToEdit[key] !== undefined && ![
                'image', 'username', 'email', 'first_name', 'last_name', 'password', 'time_since_joining', 'user', 'id'
            ].includes(key)) {
                formData.append(key, currentEmployeeToEdit[key]);
            }
        }

        if (currentEmployeeToEdit.image && typeof currentEmployeeToEdit.image !== 'string') {
            formData.append('image', currentEmployeeToEdit.image);
        }

        const userDetails = {
            username: currentEmployeeToEdit.username,
            email: currentEmployeeToEdit.email,
            first_name: currentEmployeeToEdit.first_name,
            last_name: currentEmployeeToEdit.last_name,
        };
        if (Object.values(userDetails).some(val => val !== null && val !== undefined && val !== '')) {
             formData.append('user', JSON.stringify(userDetails));
        }

        try {
            const response = await axiosInstance.patch(`/update-employee/${currentEmployeeToEdit.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Employee updated successfully:", response.data);
            setEditEmployeeSuccess(true);
            setShowEditForm(false);
            setCurrentEmployeeToEdit(null);
            fetchEmployees();

        } catch (error) {
            console.error("Error updating employee:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.detail || error.response?.data?.msg ||
                                 Object.values(error.response?.data || {}).flat().join(' ') ||
                                 "Unknown error occurred.";
            setEditEmployeeError(`Failed to update employee: ${errorMessage}`);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
                <p className="text-red-600 text-center">
                    User data missing. Please log in again.
                </p>
            </div>
        );
    }

    const DetailSubPage = ({ employee, detailKey, onBack }) => {
        if (!employee || !detailKey) return null;

        const label = detailKey.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        let value = employee[detailKey];

        if (detailKey === 'joining_date' && employee.time_since_joining) {
            value = (
                <>
                    {employee.joining_date}
                    <div className="text-sm text-neutral-600 mt-1">
                        <span className="font-medium text-neutral-700">Time since joining:</span> {employee.time_since_joining}
                    </div>
                </>
            );
        }

        if (['username', 'email', 'first_name', 'last_name'].includes(detailKey)) {
            value = employee[detailKey];
        }


        return (
            <div
                className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                                transition-transform duration-300 ease-out
                                ${showDetailSubPage === detailKey ? 'translate-x-0' : 'translate-x-full'}`}
            >
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
                        {label}
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto pt-4 pb-8 flex flex-col items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-sm mx-4 w-11/12 max-w-md text-center">
                        <p className="text-neutral-800 text-lg font-semibold mb-2">{label}:</p>
                        <p className="text-neutral-600 text-xl break-words">{value}</p>
                    </div>
                </div>
            </div>
        );
    };

    const EmployeeDetailView = ({ employee, onBack, isVisible, onManageDocuments, onDetailClick, onManagePayment, onManageAttendance, setCurrentEmployeeToEdit, setShowEditForm }) => {
        if (!employee) {
            return null;
        }

        return (
            <div
                className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                            transition-transform duration-300 ease-out
                            ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
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
                        {employee.name}
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto pt-4 pb-8">
                    <div className="mx-4 mb-5 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-white p-6 flex flex-col items-center justify-center">
                            <div className="flex-shrink-0 mb-4">
                                <img
                                    src={employee.photo}
                                    alt={employee.name}
                                    className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 shadow-md"
                                />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-neutral-900 mb-1">{employee.name}</h2>
                                <p className="text-base py-2 text-neutral-500">
                                    ID: {employee.employee_id}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mx-4 mb-5 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-white p-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">CNIC</h3>
                                <p className="text-neutral-900">{employee.cnic}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">Phone Number</h3>
                                <p className="text-neutral-900">{employee.phone_number}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">Address</h3>
                                <p className="text-neutral-900">{employee.address}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">Job Title</h3>
                                <p className="text-neutral-900">{employee.Job_title}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">Email</h3>
                                <p className="text-neutral-900">{employee.email}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">Username</h3>
                                <p className="text-neutral-900">{employee.username}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500">Joining Date</h3>
                                <div className="text-neutral-900">
                                    {employee.joining_date}
                                    <div className="text-sm text-neutral-600 mt-1">
                                        <span className="font-medium text-neutral-700">Time since joining:</span> {employee.time_since_joining}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mx-4 mt-5 rounded-xl overflow-hidden shadow-sm">
                        <ul className="bg-white divide-y divide-neutral-200">
                            <li>
                                <button
                                    onClick={() => onManageDocuments(employee)}
                                    className="w-full py-3 text-blue-600 font-normal text-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-100 ease-in-out"
                            >
                                Manage Documents
                            </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => onManageAttendance(employee)}
                                    className="w-full py-3 text-blue-600 font-normal text-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-100 ease-in-out"
                            >
                                Attendance
                            </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => onManagePayment(employee)}
                                    className="w-full py-3 text-blue-600 font-normal text-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-100 ease-in-out"
                            >
                                Payment
                            </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        setCurrentEmployeeToEdit(employee);
                                        setShowEditForm(true);
                                    }}
                                    className="w-full py-3 text-blue-600 font-normal text-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-100 ease-in-out"
                            >
                                Edit Employee
                            </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-neutral-100 font-sans text-neutral-800 relative overflow-hidden">
            <div className={`absolute inset-0 transition-transform duration-300 ease-out ${selectedEmployee || showCreateForm || showEditForm || showDocuments || showDetailSubPage || showPaymentPage || showAttendancePage || showSuppliersPage ? '-translate-x-full' : 'translate-x-0'}`}>
                
                {/* Desktop Header */}
                <div className="hidden md:flex bg-white py-4 px-6 items-center justify-between shadow-md">
                    <div className="flex items-center space-x-2">
                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2A10 10 0 0112 22A10 10 0 0112 2Z" />
                        </svg>
                        <span className="text-xl font-bold text-neutral-900 text-center">Employee Management</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => navigate('/accounts')}
                            className="flex items-center text-sm text-neutral-600 cursor-pointer hover:text-blue-600"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m3-13l-3 3-3-3" />
                            </svg>
                            Projects & Accounts
                        </button>
                        <button
                            onClick={() => setShowComingSoon("Generate Demand")}
                            className="flex items-center text-sm text-neutral-600 cursor-pointer hover:text-blue-600"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Demand
                        </button>
                        <button
                            onClick={() => setShowComingSoon("Inbox")}
                            className="relative flex items-center text-sm text-neutral-600 cursor-pointer hover:text-blue-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 5.659 7 7.045 7 8.5V11c0 .548-.135 1.076-.395 1.545L5 14.405V17h14a2 2 0 002-2v-2a2 2 0 00-2-2z" />
                            </svg>
                            <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></div>
                            Inbox
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-sm text-neutral-600 cursor-pointer hover:text-blue-600"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Signout
                        </button>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-between">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-neutral-600 active:text-blue-700 p-2"
                        aria-label="Open Menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                    <h1 className="text-xl font-semibold text-neutral-900 text-center absolute left-1/2 -translate-x-1/2">
                        Employee Management
                    </h1>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`fixed inset-0 bg-white z-40 flex flex-col transition-transform duration-300 ease-in-out transform ${showMenu ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-xl font-bold">Menu</h2>
                        <button onClick={() => setShowMenu(false)} className="p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <nav className="flex flex-col p-4 space-y-2">
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                navigate('/accounts');
                            }}
                            className="w-full text-left py-2 px-4 rounded-md hover:bg-neutral-100 flex items-center text-lg text-neutral-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m3-13l-3 3-3-3" />
                            </svg>
                            Projects & Accounts
                        </button>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                setShowComingSoon("Generate Demand");
                            }}
                            className="w-full text-left py-2 px-4 rounded-md hover:bg-neutral-100 flex items-center text-lg text-neutral-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Demand
                        </button>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                setShowComingSoon("Inbox");
                            }}
                            className="w-full text-left py-2 px-4 rounded-md hover:bg-neutral-100 flex items-center text-lg text-neutral-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 5.659 7 7.045 7 8.5V11c0 .548-.135 1.076-.395 1.545L5 14.405V17h14a2 2 0 002-2v-2a2 2 0 00-2-2z" />
                            </svg>
                            Inbox
                        </button>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                setShowSuppliersPage(true);
                            }}
                            className="w-full text-left py-2 px-4 rounded-md hover:bg-neutral-100 flex items-center text-lg text-neutral-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9l-4 4m0 0l-4-4m4 4V3m-2 15h6a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                            </svg>
                            Suppliers
                        </button>
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                handleLogout();
                            }}
                            className="w-full text-left py-2 px-4 rounded-md hover:bg-neutral-100 flex items-center text-lg text-red-600"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                        </button>
                    </nav>
                </div>

                <div className="pt-4 pb-8 h-[calc(100vh-60px)] overflow-y-auto">
                    {/* Welcome Banner */}
                    <div className="bg-white p-6 rounded-lg shadow-md mx-4 my-6">
                        <h2 className="text-xl font-semibold text-neutral-800">Welcome Mr. Fiaz (Accounts & Store)</h2>
                        <p className="text-sm text-neutral-500 mt-1">Manage your team and track demands efficiently</p>
                    </div>

                    {/* Employee Directory Section */}
                    <div className="w-full max-w-6xl mx-auto p-6 bg-neutral-50 rounded-xl shadow-lg border border-neutral-200 mt-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-neutral-800">Employee Directory</h2>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-2 px-6 rounded-full flex items-center shadow-lg hover:from-blue-700 hover:to-blue-900 transform transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Add Employee
                            </button>
                        </div>

                        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${selectedEmployee || showDocuments || showDetailSubPage || showPaymentPage || showAttendancePage ? "pointer-events-none" : ""}`}>
                            {employees.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center cursor-pointer transition-transform duration-200 ease-in-out hover:shadow-xl active:scale-[0.98]"
                                    onClick={() => handleEmployeeClick(emp)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`View details for ${emp.name}`}
                                >
                                    <img
                                        src={emp.photo}
                                        alt={emp.name}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
                                    />
                                    <h3 className="font-bold text-neutral-900 text-lg">{emp.name}</h3>
                                    <p className="text-sm text-neutral-600 mt-1">{emp.Job_title}</p>
                                    <div className="flex items-center justify-center mt-4 space-x-2">
                                        <button className="bg-blue-500 text-white text-sm font-medium py-1 px-3 rounded-full hover:bg-blue-600 transition-colors">
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <EmployeeDetailView
                employee={selectedEmployee}
                onBack={handleBackFromEmployeeDetail}
                isVisible={!!selectedEmployee && !showDetailSubPage && !showPaymentPage && !showAttendancePage}
                onManageDocuments={handleManageDocumentsClick}
                onDetailClick={handleDetailClick}
                onManagePayment={handleManagePaymentClick}
                onManageAttendance={handleManageAttendanceClick}
                setCurrentEmployeeToEdit={setCurrentEmployeeToEdit}
                setShowEditForm={setShowEditForm}
            />

            <div
                className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                                transition-transform duration-300 ease-out
                                ${showCreateForm ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-start">
                    <button
                        onClick={() => { setShowCreateForm(false); setCreateEmployeeError(null); setCreateEmployeeSuccess(false); }}
                        className="text-blue-600 text-lg font-normal flex items-center active:text-blue-700"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                    </button>
                    <h1 className="text-xl font-semibold text-neutral-900 text-center absolute left-1/2 -translate-x-1/2">
                        Create Employee
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto pt-4 pb-8">
                    {createEmployeeError && (
                        <p className="text-red-600 text-center mb-4 text-sm px-4">{createEmployeeError}</p>
                    )}
                    {createEmployeeSuccess && (
                        <p className="text-green-600 text-center mb-4 text-sm px-4">Employee created successfully!</p>
                    )}

                    <form onSubmit={handleCreateEmployeeSubmit} className="mx-4 mb-5 rounded-xl overflow-hidden shadow-sm p-6 bg-white">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 text-center">Employee Profile Details</h2>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-neutral-700 text-sm font-bold mb-2">Full Name:</label>
                            <input type="text" id="name" name="name" value={newEmployeeData.name} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="cnic" className="block text-neutral-700 text-sm font-bold mb-2">CNIC:</label>
                            <input type="text" id="cnic" name="cnic" value={newEmployeeData.cnic} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="phone_number" className="block text-neutral-700 text-sm font-bold mb-2">Phone Number:</label>
                            <input type="text" id="phone_number" name="phone_number" value={newEmployeeData.phone_number} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="address" className="block text-neutral-700 text-sm font-bold mb-2">Address:</label>
                            <input type="text" id="address" name="address" value={newEmployeeData.address} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="Job_title" className="block text-neutral-700 text-sm font-bold mb-2">Job Title:</label>
                            <input type="text" id="Job_title" name="Job_title" value={newEmployeeData.Job_title} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="employee_id" className="block text-neutral-700 text-sm font-bold mb-2">Employee ID:</label>
                            <input type="text" id="employee_id" name="employee_id" value={newEmployeeData.employee_id} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="joining_date" className="block text-neutral-700 text-sm font-bold mb-2">Joining Date:</label>
                            <input type="date" id="joining_date" name="joining_date" value={newEmployeeData.joining_date} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="image" className="block text-neutral-700 text-sm font-bold mb-2">Profile Image:</label>
                            <input type="file" id="image" name="image" onChange={handleNewEmployeeFileChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>

                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 mt-6">New User Account Details</h2>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-neutral-700 text-sm font-bold mb-2">Username:</label>
                            <input type="text" id="username" name="username" value={newEmployeeData.username} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-neutral-700 text-sm font-bold mb-2">Email:</label>
                            <input type="email" id="email" name="email" value={newEmployeeData.email} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="first_name" className="block text-neutral-700 text-sm font-bold mb-2">First Name:</label>
                            <input type="text" id="first_name" name="first_name" value={newEmployeeData.first_name} onChange={handleNewEmployeeInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="last_name" className="block text-neutral-700 text-sm font-bold mb-2">Last Name:</label>
                            <input type="text" id="last_name" name="last_name" value={newEmployeeData.last_name} onChange={handleNewEmployeeInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-neutral-700 text-sm font-bold mb-2">Password:</label>
                            <input type="password" id="password" name="password" value={newEmployeeData.password} onChange={handleNewEmployeeInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"/>
                        </div>

                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline">
                            Create Employee
                        </button>
                    </form>
                </div>
            </div>

            <div
                className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                                transition-transform duration-300 ease-out
                                ${showEditForm ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-start">
                    <button
                        onClick={() => { setShowEditForm(false); setEditEmployeeError(null); setEditEmployeeSuccess(false); setCurrentEmployeeToEdit(null); }}
                        className="text-blue-600 text-lg font-normal flex items-center active:text-blue-700"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                    </button>
                    <h1 className="text-xl font-semibold text-neutral-900 text-center absolute left-1/2 -translate-x-1/2">
                        Edit Employee
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto pt-4 pb-8">
                    {editEmployeeError && (
                        <p className="text-red-600 text-center mb-4 text-sm px-4">{editEmployeeError}</p>
                    )}
                    {editEmployeeSuccess && (
                        <p className="text-green-600 text-center mb-4 text-sm px-4">Employee updated successfully!</p>
                    )}

                    {currentEmployeeToEdit && (
                        <form onSubmit={handleUpdateEmployeeSubmit} className="mx-4 mb-5 rounded-xl overflow-hidden shadow-sm p-6 bg-white">
                            <h2 className="text-lg font-semibold text-neutral-800 mb-4 text-center">Employee Profile Details</h2>
                            <div className="mb-4">
                                <label htmlFor="edit_name" className="block text-neutral-700 text-sm font-bold mb-2">Full Name:</label>
                                <input type="text" id="edit_name" name="name" value={currentEmployeeToEdit.name || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_cnic" className="block text-neutral-700 text-sm font-bold mb-2">CNIC:</label>
                                <input type="text" id="edit_cnic" name="cnic" value={currentEmployeeToEdit.cnic || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_phone_number" className="block text-neutral-700 text-sm font-bold mb-2">Phone Number:</label>
                                <input type="text" id="edit_phone_number" name="phone_number" value={currentEmployeeToEdit.phone_number || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_address" className="block text-neutral-700 text-sm font-bold mb-2">Address:</label>
                                <input type="text" id="edit_address" name="address" value={currentEmployeeToEdit.address || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_Job_title" className="block text-neutral-700 text-sm font-bold mb-2">Job Title:</label>
                                <input type="text" id="edit_Job_title" name="Job_title" value={currentEmployeeToEdit.Job_title || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_employee_id" className="block text-neutral-700 text-sm font-bold mb-2">Employee ID:</label>
                                <input type="text" id="edit_employee_id" name="employee_id" value={currentEmployeeToEdit.employee_id || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_joining_date" className="block text-neutral-700 text-sm font-bold mb-2">Joining Date:</label>
                                <input type="date" id="edit_joining_date" name="joining_date" value={currentEmployeeToEdit.joining_date || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-6">
                                <label htmlFor="edit_image" className="block text-neutral-700 text-sm font-bold mb-2">Profile Image:</label>
                                <input type="file" id="edit_image" name="image" onChange={handleEditEmployeeFileChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                                {currentEmployeeToEdit.photo && typeof currentEmployeeToEdit.photo === 'string' && (
                                    <p className="text-sm text-neutral-500 mt-1">Current image: <a href={currentEmployeeToEdit.photo} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View</a></p>
                                )}
                            </div>

                            <h2 className="text-lg font-semibold text-neutral-800 mb-4 mt-6">User Account Details (Optional)</h2>
                            <div className="mb-4">
                                <label htmlFor="edit_username" className="block text-neutral-700 text-sm font-bold mb-2">Username:</label>
                                <input type="text" id="edit_username" name="username" value={currentEmployeeToEdit.username || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_email" className="block text-neutral-700 text-sm font-bold mb-2">Email:</label>
                                <input type="email" id="edit_email" name="email" value={currentEmployeeToEdit.email || ''} onChange={handleEditEmployeeInputChange} required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_first_name" className="block text-neutral-700 text-sm font-bold mb-2">First Name:</label>
                                <input type="text" id="edit_first_name" name="first_name" value={currentEmployeeToEdit.first_name || ''} onChange={handleEditEmployeeInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="edit_last_name" className="block text-neutral-700 text-sm font-bold mb-2">Last Name:</label>
                                <input type="text" id="edit_last_name" name="last_name" value={currentEmployeeToEdit.last_name || ''} onChange={handleEditEmployeeInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-700 leading-tight focus:outline-none focus:shadow-outline"/>
                            </div>

                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline">
                                Update Employee
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {employeeForDocuments && (
                <div
                    className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                                transition-transform duration-300 ease-out
                                ${showDocuments ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <EmployeeDocuments
                        employeeId={employeeForDocuments.id}
                        employeeName={employeeForDocuments.name}
                        onBack={handleBackFromDocuments}
                    />
                </div>
            )}

            {showDetailSubPage && employeeForDetailSubPage && (
                <DetailSubPage
                    employee={employeeForDetailSubPage}
                    detailKey={showDetailSubPage}
                    onBack={handleBackFromDetailSubPage}
                />
            )}

            {showPaymentPage && employeeForPayment && (
                <MemoizedPayAdmin
                    employeeId={employeeForPayment.id}
                    employeeName={employeeForPayment.name}
                    onBack={handleBackFromPayment}
                />
            )}

            {showAttendancePage && employeeForAttendance && (
                <div
                    className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                                transition-transform duration-300 ease-out
                                ${showAttendancePage ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <Attendance
                        employeeId={employeeForAttendance.id}
                        employeeName={employeeForAttendance.name}
                        onBack={handleBackFromAttendance}
                    />
                </div>
            )}

            {showSuppliersPage && (
                 <div
                    className={`fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans
                                transition-transform duration-300 ease-out
                                ${showSuppliersPage ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <Suppliers onBack={handleBackFromSuppliers} />
                </div>
            )}

            {showComingSoon && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-30">
                    <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
                        <svg
                            className="w-16 h-16 mb-4 text-blue-600 animate-bounce"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"></path>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
                        </svg>
                        <h3 className="text-xl font-bold text-neutral-900 mb-2">{showComingSoon} Feature</h3>
                        <p className="text-neutral-600 text-base">Coming Soon!</p>
                    </div>
                </div>
            )}
        </div>
    );
}