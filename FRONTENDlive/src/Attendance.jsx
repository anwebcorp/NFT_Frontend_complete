// your_react_project/src/Attendance.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ensure axiosInstance is loaded
      if (!axiosRef.current) {
        const mod = await import("./axiosInstance");
        axiosRef.current = mod.default || mod;
      }
      const axios = axiosRef.current;

      // Fetch employees list
      const employeesResponse = await axios.get("employees/");
      const fetchedEmployees = employeesResponse.data.map(emp => ({
        id: emp.id,
        name: emp.name,
        job_title: emp.Job_title,
        photo: emp.image ? `https://employeemanagement.company${emp.image}` : `https://placehold.co/150x150/CCCCCC/FFFFFF?text=${emp.name.charAt(0)}`
      }));
      setEmployees(fetchedEmployees);

      // Fetch attendance for selected date
      const attendanceResponse = await axios.get("attendance/admin/daily/", {
        params: { date: selectedDate }
      });

      // Create a map using monthly field as the key
      const attendanceMap = {};
      attendanceResponse.data.forEach(record => {
        const employeeId = record.monthly;
        if (employeeId) {
          attendanceMap[employeeId] = record;
        }
      });

      setAttendanceStatusToday(attendanceMap);
    } catch (err) {
      console.error("Failed to fetch attendance data:", err);
      setError(err.response?.data?.error || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, selectedDate]);

  const handleMarkAttendance = useCallback(async (employeeId, status) => {
    setLoading(true);
    setError(null);
    try {
      if (!axiosRef.current) {
        const mod = await import("./axiosInstance");
        axiosRef.current = mod.default || mod;
      }
      const axios = axiosRef.current;

      const response = await axios.post("attendance/create/", {
        profile: employeeId,
        date: selectedDate,
        status: status
      });

      if (response.data) {
        await fetchInitialData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark attendance.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, fetchInitialData]);

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
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  // Determine which view to show based on isDashboard prop
  const isDashboard = employeeName === 'Dashboard';

  return (
    // use CSS variable --vh to set the visible viewport height on mobile (avoid h-screen)
    <div className="p-4 flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Logo and Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Admin Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Attendance Management</h1>
            <p className="text-gray-500 text-sm">Track and manage employee attendance records</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-600">Current Date:</div>
          <div className="font-medium">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Content based on employeeName */}
      {isDashboard ? (
        // Daily attendance view for Dashboard
        // set minHeight:0 so the flex child (scroll container) can shrink and scroll on mobile
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col" style={{ minHeight: 0 }}>
          <div
            className="overflow-y-auto flex-1"
            style={{
              WebkitOverflowScrolling: 'touch', // enables momentum scrolling on iOS
              touchAction: 'pan-y',             // ensure vertical touch panning
              overflowY: 'auto'                 // explicit overflow for some browsers
            }}
          >
            {/* Add Dashboard Stats inside the scrollable area so they scroll away on scroll down */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 pb-2">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h2 className="text-blue-600 text-lg font-semibold mb-2">Total</h2>
                    <p className="text-3xl font-bold text-blue-700">{calculateDashboardStats(attendanceStatusToday).total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h2 className="text-green-600 text-lg font-semibold mb-2">Present</h2>
                    <p className="text-3xl font-bold text-green-700">{calculateDashboardStats(attendanceStatusToday).present}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h2 className="text-red-600 text-lg font-semibold mb-2">Absent</h2>
                    <p className="text-3xl font-bold text-red-700">{calculateDashboardStats(attendanceStatusToday).absent}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h2 className="text-yellow-600 text-lg font-semibold mb-2">Late</h2>
                    <p className="text-3xl font-bold text-yellow-700">{calculateDashboardStats(attendanceStatusToday).late}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing table (rendered directly inside scroll container)
                Wrap table in horizontal scroll container for mobile so full row can be reached */}
            <div
              className="overflow-x-auto table-responsive"
              style={{
                WebkitOverflowScrolling: 'touch', // momentum on iOS for horizontal scroll
                overflowX: 'auto',
                touchAction: 'pan-x', // allow horizontal swipes
              }}
            >
              <table className="min-w-full w-full">
               <thead className="bg-gray-50 sticky top-0 z-10">
                 <tr>
                   <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                   <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                   <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase">Day</th>
                   <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Time Marked</th>
                   <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase">Location</th>
                   <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200">
                 {employees.map((employee) => (
                   <tr key={employee.id} className="hover:bg-gray-50">
                     <td className="p-4">
                       <div className="flex items-center">
                         <img src={employee.photo} alt="" className="w-8 h-8 rounded-full mr-3" />
                         <div>
                           <div className="font-medium text-gray-900">{employee.name}</div>
                           <div className="text-sm text-gray-500">{employee.job_title}</div>
                         </div>
                       </div>
                     </td>
                     <td className="p-4 text-center text-sm text-gray-500">
                       {attendanceStatusToday[employee.id]?.date ? formatDate(attendanceStatusToday[employee.id].date) : '-'}
                     </td>
                     <td className="p-4 text-center text-sm text-gray-500">
                       {attendanceStatusToday[employee.id]?.day || '-'}
                     </td>
                     <td className="p-4 text-center">
                       {attendanceStatusToday[employee.id]?.time ? (
                         <div className="flex flex-col">
                           <span className="font-medium text-gray-900">{formatTime(attendanceStatusToday[employee.id].time).time24}</span>
                           <span className="text-xs text-gray-500">{formatTime(attendanceStatusToday[employee.id].time).time12}</span>
                         </div>
                       ) : '-'}
                     </td>
                     <td className="p-4 text-center">
                       {attendanceStatusToday[employee.id]?.location ? (
                         <div className="flex flex-col items-center">
                           <button onClick={() => window.open('https://www.google.com/maps', '_blank')} className="text-blue-600 hover:text-blue-800 text-sm">View Location</button>
                           <span className="text-xs text-gray-500 mt-1 select-all">{attendanceStatusToday[employee.id].location}</span>
                         </div>
                       ) : '-'}
                     </td>
                     <td className="p-4 text-center">
                       <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                         attendanceStatusToday[employee.id]?.status === 'Present' ? 'bg-green-100 text-green-800' :
                         attendanceStatusToday[employee.id]?.status === 'Absent' ? 'bg-red-100 text-red-800' :
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {capitalize(attendanceStatusToday[employee.id]?.status || 'Not Marked')}
                       </span>
                     </td>
                   </tr>
                 ))}
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