// your_react_project/src/Attendance.jsx

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import "./styles/scrollbar.css";

// dynamically import axiosInstance to avoid module resolution errors at module eval time
// and lazy-load HistoryAdminAttendance so Vite doesn't fail if the file is temporarily missing.
const HistoryAdminAttendanceLazy = React.lazy(() => import('./HistoryAdminAttendance'));

// Helper function to capitalize the first letter of a string
const capitalize = (s) => {
  if (typeof s !== 'string' || !s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Add these helper functions at the top
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

const formatTime = (timeString) => {
  try {
    // Create a date object using current date and the time string
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    
    return {
      time24: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      time12: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  } catch (error) {
    return { time24: timeString, time12: timeString };
  }
};

const Attendance = ({ employeeId, employeeName, onBack }) => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatusToday, setAttendanceStatusToday] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isStatsVisible, setIsStatsVisible] = useState(true);

  // add a ref to cache axiosInstance after dynamic import
  const axiosRef = useRef(null);

  // set CSS --vh custom property for mobile viewport height (fixes 100vh issues)
  useEffect(() => {
    const setVh = () => {
      // 1vh = 1% of the viewport height; store 1vh in px as --vh
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Add new helper function to map employees to monthly IDs
  const createEmployeeMapping = (employees) => {
    const mapping = {
      monthlyToEmployee: {},
      employeeToMonthly: {}
    };
    
    employees.sort((a, b) => a.id - b.id).forEach(emp => {
      // For each employee ID (45, 46, 47, 48), assign monthly ID (44, 45, 46, 47)
      const monthlyId = emp.id - 1;
      mapping.monthlyToEmployee[monthlyId] = emp.id;
      mapping.employeeToMonthly[emp.id] = monthlyId;
    });
    
    return mapping;
  };

  // Update fetchInitialData with fixed mapping logic
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!axiosRef.current) {
        const mod = await import("./axiosInstance");
        axiosRef.current = mod.default || mod;
      }
      const axios = axiosRef.current;

      // Get employees and attendance data
      const [employeesResponse, attendanceResponse] = await Promise.all([
        axios.get("employees/"),
        axios.get(`attendance/admin/daily/?date=${selectedDate}`)
      ]);

      const fetchedEmployees = employeesResponse.data.map(emp => ({
        id: Number(emp.id),
        name: emp.name,
        job_title: emp.Job_title,
        photo: emp.image ? `https://employeemanagement.company${emp.image}` : `https://placehold.co/150x150/CCCCCC/FFFFFF?text=${emp.name.charAt(0)}`
      }));
      
      setEmployees(fetchedEmployees);

      // Create attendance map
      const attendanceMap = {};
      
      // Initialize all employees with "Not Marked"
      fetchedEmployees.forEach(emp => {
        attendanceMap[emp.id] = {
          profile: emp.id,
          date: selectedDate,
          day: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }),
          status: 'Not Marked',
          time: null,
          location: null
        };
      });

      // Update with actual attendance records
      if (Array.isArray(attendanceResponse.data)) {
        attendanceResponse.data.forEach(record => {
          const employeeId = Number(record.profile);
          if (attendanceMap[employeeId]) {
            attendanceMap[employeeId] = {
              ...record,
              profile: employeeId
            };
          }
        });
      }

      console.log('Final processed attendance map:', attendanceMap);
      setAttendanceStatusToday(attendanceMap);

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Remove the duplicate useEffect and keep only this one
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Update handleMarkAttendance to use the mapping
  const handleMarkAttendance = useCallback(async (empId, status) => {
    setLoading(true);
    setError(null);
    try {
      if (!axiosRef.current) {
        const mod = await import("./axiosInstance");
        axiosRef.current = mod.default || mod;
      }
      const axios = axiosRef.current;

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      // Get the current mapping for this employee
      const mapping = createEmployeeMapping(employees);
      const monthlyId = mapping.employeeToMonthly[empId];

      const payload = {
        profile: empId,
        monthly: monthlyId,  // Include monthly ID in payload
        status: status,
        date: selectedDate,
        location: `${position.coords.latitude},${position.coords.longitude}`
      };

      console.log('Marking attendance payload:', payload);
      const response = await axios.post("attendance/create/", payload);

      if (response.data && response.data.id) {
        await fetchInitialData();
        setError(null);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err) {
      console.error('Mark attendance error:', err);
      if (err.name === 'GeolocationPositionError') {
        setError("Please enable location services to mark attendance");
      } else {
        setError(err.response?.data?.error || "Failed to mark attendance");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, fetchInitialData, employees]);

  // Add new function to calculate summary
  const calculateSummary = (records) => {
    return {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: 0 // You can add logic for late if needed
    };
  };

  // Modify the calculateMonthSummary function
  const calculateMonthSummary = (records) => {
    return {
      totalDays: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
    };
  };

  const calculateDashboardStats = (attendanceData) => {
    const total = employees.length;
    const present = Object.values(attendanceData).filter(record => record.status === 'Present').length;
    const absent = Object.values(attendanceData).filter(record => record.status === 'Absent').length;
    const late = Object.values(attendanceData).filter(record => record.status === 'Late').length;

    return { total, present, absent, late };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  // Determine which view to show based on isDashboard prop
  const isDashboard = employeeName === 'Dashboard';

  // Create a memoized employee row component
  const EmployeeRow = memo(({ employee, attendanceRecord, selectedDate }) => {
    return (
      <tr className="hover:bg-gray-50 border-b">
        <td className="p-2 md:p-4">
          <div className="flex items-center gap-2">
            <img src={employee.photo} alt="" className="w-6 md:w-8 h-6 md:h-8 rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-xs md:text-sm truncate">{employee.name}</div>
              <div className="text-xs text-gray-500 truncate">{employee.job_title}</div>
            </div>
          </div>
        </td>
        
        <td className="p-2 md:p-4 text-center text-xs md:text-sm text-gray-500">
          {attendanceRecord?.date ? formatDate(attendanceRecord.date) : formatDate(selectedDate)}
        </td>
        
        <td className="p-2 md:p-4 text-center text-xs md:text-sm text-gray-500">
          {attendanceRecord?.day || new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
        </td>
        
        <td className="p-2 md:p-4 text-center text-xs md:text-sm">
          {attendanceRecord?.time ? (
            <div className="flex flex-col items-center">
              <span className="font-medium">{formatTime(attendanceRecord.time).time24}</span>
              <span className="text-xs text-gray-500 hidden md:inline">{formatTime(attendanceRecord.time).time12}</span>
            </div>
          ) : '-'}
        </td>
        
        <td className="p-2 md:p-4 text-center">
          {attendanceRecord?.location ? (
            <div className="flex flex-col items-center">
              <button 
                onClick={() => window.open(`https://www.google.com/maps?q=${attendanceRecord.location}`, '_blank')}
                className="text-blue-600 hover:text-blue-800 text-xs md:text-sm underline"
              >
                View
              </button>
            </div>
          ) : '-'}
        </td>
        
        <td className="p-2 md:p-4 text-center">
          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap ${
            attendanceRecord?.status === 'Present' ? 'bg-green-100 text-green-800' :
            attendanceRecord?.status === 'Absent' ? 'bg-red-100 text-red-800' :
            attendanceRecord?.status === 'Leave' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {attendanceRecord?.status === 'Present' ? 'P' :
             attendanceRecord?.status === 'Absent' ? 'A' :
             attendanceRecord?.status === 'Leave' ? 'L' :
             'N'}
          </span>
        </td>
      </tr>
    );
  });

  return (
    // use CSS variable --vh to set the visible viewport height on mobile (avoid h-screen)
    <div className="p-4 flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Logo and Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            title="Back to Admin Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">Attendance Management</h1>
            <p className="text-gray-500 text-xs md:text-sm truncate">Track and manage employee attendance records</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-gray-600 text-xs md:text-sm">Current Date:</div>
            <div className="font-medium text-sm md:text-base">{new Date().toLocaleDateString()}</div>
          </div>
          {isDashboard && (
            <button
              onClick={async () => {
                try {
                  if (!axiosRef.current) {
                    const mod = await import("./axiosInstance");
                    axiosRef.current = mod.default || mod;
                  }
                  const axios = axiosRef.current;
                  const response = await axios.get(`attendance/pdf/`, {
                    responseType: 'blob',
                    headers: {
                      'Accept': 'application/pdf, application/json'
                    }
                  });
                  
                  // Check if the response is JSON (error message)
                  if (response.headers['content-type'].includes('application/json')) {
                    const blob = new Blob([response.data]);
                    const text = await new Response(blob).text();
                    const error = JSON.parse(text);
                    throw new Error(error.error || 'Failed to download employee list');
                  }
                  
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'Employee_List.pdf');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Download error:', err);
                  setError(err.response?.data?.error || "Failed to download attendance data");
                }
              }}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-200 transform hover:scale-110 flex-shrink-0"
              title="Download Attendance"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          {isDashboard && (
            <button
              onClick={() => setIsStatsVisible(!isStatsVisible)}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-200 transform hover:scale-110 flex-shrink-0"
              title={isStatsVisible ? "Hide Stats" : "Show Stats"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                  isStatsVisible ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content based on employeeName */}
      {isDashboard ? (
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col max-h-[calc(100vh-200px)] overflow-hidden">
          {/* Stats grid with transition */}
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-3 md:p-4 pb-2 bg-white sticky top-0 z-10 transition-all duration-300 ease-in-out ${
              isStatsVisible ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'
            }`}
          >
            {/* Stats grid content */}
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-blue-600 text-xs md:text-lg font-semibold mb-1 md:mb-2 truncate">Total</h2>
                  <p className="text-2xl md:text-3xl font-bold text-blue-700">{calculateDashboardStats(attendanceStatusToday).total}</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-100 rounded-full hidden md:flex flex-shrink-0">
                  <svg className="w-5 md:w-6 h-5 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 md:p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-green-600 text-xs md:text-lg font-semibold mb-1 md:mb-2 truncate">P</h2>
                  <p className="text-2xl md:text-3xl font-bold text-green-700">{calculateDashboardStats(attendanceStatusToday).present}</p>
                </div>
                <div className="p-2 md:p-3 bg-green-100 rounded-full hidden md:flex flex-shrink-0">
                  <svg className="w-5 md:w-6 h-5 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-3 md:p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-red-600 text-xs md:text-lg font-semibold mb-1 md:mb-2 truncate">A</h2>
                  <p className="text-2xl md:text-3xl font-bold text-red-700">{calculateDashboardStats(attendanceStatusToday).absent}</p>
                </div>
                <div className="p-2 md:p-3 bg-red-100 rounded-full hidden md:flex flex-shrink-0">
                  <svg className="w-5 md:w-6 h-5 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-yellow-600 text-xs md:text-lg font-semibold mb-1 md:mb-2 truncate">L</h2>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-700">
                    {Object.values(attendanceStatusToday).filter(record => record?.status === 'Leave').length}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-yellow-100 rounded-full hidden md:flex flex-shrink-0">
                  <svg className="w-5 md:w-6 h-5 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table container with dynamic height */}
          <div 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div 
              className="overflow-auto flex-1"
            >
              <table className="w-full table-auto min-w-max">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-2 md:p-4 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                    <th className="p-2 md:p-4 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="p-2 md:p-4 text-center text-xs font-medium text-gray-500 uppercase">Day</th>
                    <th className="p-2 md:p-4 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Time Marked</th>
                    <th className="p-2 md:p-4 text-center text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="p-2 md:p-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.sort((a, b) => a.id - b.id).map((employee) => {
                    const employeeAttendance = attendanceStatusToday[employee.id] || {
                      profile: employee.id,
                      date: selectedDate,
                      day: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }),
                      status: 'Not Marked',
                      time: null,
                      location: null
                    };
                    
                    return (
                      <EmployeeRow
                        key={employee.id}
                        employee={employee}
                        attendanceRecord={employeeAttendance}
                        selectedDate={selectedDate}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // History view for employee attendance (lazy-loaded)
        <React.Suspense fallback={<div className="p-4">Loading history...</div>}>
          <HistoryAdminAttendanceLazy
            employees={employees}
            selectedEmployee={employees.find(emp => emp.id === employeeId)}
            onSelectEmployee={(employeeId) => {
              const employee = employees.find(emp => emp.id === Number(employeeId));
              setSelectedEmployee(employee);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default Attendance;