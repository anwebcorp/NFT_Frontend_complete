// your_react_project/src/pages/Attendance.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "./axiosInstance";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper function to capitalize the first letter of a string
const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const Attendance = ({ employeeId: propEmployeeId, employeeName: propEmployeeName, onBack }) => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatusToday, setAttendanceStatusToday] = useState({});
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [backendSheets, setBackendSheets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // State to force a data refresh

  const [viewMode, setViewMode] = useState('dailyMarking');
  const [employeeOverallSummary, setEmployeeOverallSummary] = useState([]);
  const [allEmployeesOverallSummary, setAllEmployeesOverallSummary] = useState([]);
  const [expandedYear, setExpandedYear] = useState(null);
  const [expandedMonthInYear, setExpandedMonthInYear] = useState(null);
  const [calendarEmployee, setCalendarEmployee] = useState(null);
  const [visibleEmployeesCount, setVisibleEmployeesCount] = useState(5);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const employeesResponse = await axiosInstance.get("employees/");
      const fetchedEmployees = employeesResponse.data
        .map(emp => ({
            id: emp.id,
            name: emp.name,
            job_title: emp.Job_title,
            photo: emp.image ? `https://employeemanagement.company${emp.image}` : `https://placehold.co/150x150/CCCCCC/FFFFFF?text=${emp.name.charAt(0)}`
        }));
      setEmployees(fetchedEmployees);

      const attendanceResponse = await axiosInstance.get("admin/all/");
      const fetchedBackendSheets = attendanceResponse.data;
      setBackendSheets(fetchedBackendSheets);
      
      const newAttendanceRecords = {};
      if (Array.isArray(attendanceResponse.data)) {
        attendanceResponse.data.forEach(sheet => {
          const employeeId = sheet.profile;
          // The backend response for 'admin/all' seems to return an `entries` array, not `daily_records`.
          // We need to parse it to a `daily_records` object for the existing logic to work.
          const dailyRecords = sheet.entries ? sheet.entries.reduce((acc, entry) => {
            acc[entry.date] = entry.status;
            return acc;
          }, {}) : {};

          newAttendanceRecords[employeeId] = { ...newAttendanceRecords[employeeId], ...dailyRecords };
        });
      }
      setAttendanceRecords(newAttendanceRecords);

      const initialStatus = {};
      fetchedEmployees.forEach(emp => {
        initialStatus[emp.id] = newAttendanceRecords[emp.id]?.[selectedDate] || null;
      });
      setAttendanceStatusToday(initialStatus);

    } catch (err) {
      console.error("Failed to fetch attendance data:", err);
      setError("Failed to load attendance data.");
      setEmployees([]);
      setAttendanceRecords({});
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, refreshKey]);

  const handleRefreshData = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight) {
      setVisibleEmployeesCount(prevCount => Math.min(prevCount + 5, employees.length));
    }
  };

  const fetchEmployeeOverallSummary = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("admin/all/");
      const allSheets = response.data;
      const filteredSheets = allSheets.filter(sheet => sheet.profile === id);
      setEmployeeOverallSummary(filteredSheets);
    } catch (err) {
      console.error(`Error fetching summary for employee ${id}:`, err);
      setError(`Failed to load overall attendance for this employee. Ensure the backend endpoint 'admin/all/' exists and is correctly implemented.`);
      setEmployeeOverallSummary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllEmployeesOverallSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("admin/all/");
      setAllEmployeesOverallSummary(response.data);
      setExpandedYear(null);
      setExpandedMonthInYear(null);
    } catch (err) {
      console.error("Error fetching all employees summary:", err);
      setError("Failed to load overall attendance for all employees. Ensure 'admin/all/' endpoint is accessible and returns summary data.");
      setAllEmployeesOverallSummary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const groupedAttendanceByYearAndMonth = useMemo(() => {
    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const grouped = allEmployeesOverallSummary.reduce((acc, sheet) => {
      const yearKey = sheet.year.toString();
      const monthKey = capitalize(sheet.month);

      if (!acc[yearKey]) {
        acc[yearKey] = {};
      }
      if (!acc[yearKey][monthKey]) {
        acc[yearKey][monthKey] = [];
      }
      acc[yearKey][monthKey].push(sheet);
      return acc;
    }, {});

    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    const sortedGrouped = {};
    sortedYears.forEach(year => {
      const monthsInYear = Object.keys(grouped[year]).sort((a, b) => monthOrder.indexOf(b) - monthOrder.indexOf(a));
      sortedGrouped[year] = {};
      monthsInYear.forEach(month => {
        sortedGrouped[year][month] = grouped[year][month].sort((a, b) => a.profile_name.localeCompare(b.profile_name));
      });
    });

    return sortedGrouped;
  }, [allEmployeesOverallSummary]);

  const handleMarkAttendance = useCallback(async (employeeId, status) => {
      setLoading(true);
      setError(null);
      try {
          const dateToMark = selectedDate;
          const dateObj = new Date(dateToMark);
          const month = dateObj.toLocaleString('default', { month: 'long' });
          const year = dateObj.getFullYear();
          
          let employeeAttendanceSheet = backendSheets.find(sheet =>
              sheet.profile === employeeId &&
              sheet.month.toLowerCase() === month.toLowerCase() &&
              sheet.year === year
          );

          if (!employeeAttendanceSheet) {
              const newSheet = {
                  profile: employeeId,
                  month: capitalize(month),
                  year: year,
                  entries: [{ date: dateToMark, status: status }]
              };
              await axiosInstance.post("admin/create/", newSheet);
          } else {
              // The backend expects an array of entries for PATCH, not a daily_records object
              const currentEntries = employeeAttendanceSheet.entries || [];
              const entryIndex = currentEntries.findIndex(entry => entry.date === dateToMark);
              
              let updatedEntries;
              if (entryIndex > -1) {
                  // Update existing entry
                  updatedEntries = [...currentEntries];
                  updatedEntries[entryIndex] = { date: dateToMark, status: status };
              } else {
                  // Add new entry
                  updatedEntries = [...currentEntries, { date: dateToMark, status: status }];
              }

              const sheetId = employeeAttendanceSheet.id;
              // ⚠️ FIX: The URL for PATCH must include '/sheet/' as per urls.py.
              await axiosInstance.patch(`admin/sheet/${sheetId}/`, { entries: updatedEntries });
          }

          setAttendanceStatusToday(prevStatus => ({
              ...prevStatus,
              [employeeId]: status
          }));
          setRefreshKey(prevKey => prevKey + 1);

      } catch (err) {
          console.error("Error marking attendance:", err.response || err);
          setError("Failed to mark attendance. Please try again.");
      } finally {
          setLoading(false);
      }
  }, [selectedDate, backendSheets]);

  const openHistoryModal = (employee) => {
    setSelectedEmployeeForModal(employee);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setSelectedEmployeeForModal(null);
    setShowHistoryModal(false);
  };

  const toggleYearAccordion = (year) => {
    if (expandedYear === year) {
      setExpandedYear(null);
      setExpandedMonthInYear(null);
    } else {
      setExpandedYear(year);
      setExpandedMonthInYear(null);
    }
  };

  const toggleMonthAccordion = (month) => {
    setExpandedMonthInYear(prevMonth => (prevMonth === month ? null : month));
  };

  const openCalendarForEmployee = (employee) => {
    setCalendarEmployee(employee);
  };

  const closeCalendarView = () => {
    setCalendarEmployee(null);
  };
  
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  useEffect(() => {
    if (viewMode === 'employeeSummary' && propEmployeeId) {
      fetchEmployeeOverallSummary(propEmployeeId);
    } else if (viewMode === 'allSummary') {
      fetchAllEmployeesOverallSummary();
    }
  }, [viewMode, propEmployeeId, fetchEmployeeOverallSummary, fetchAllEmployeesOverallSummary]);

  const handleBackToAdmin = () => {
    if (viewMode !== 'dailyMarking') {
      setViewMode('dailyMarking');
      setExpandedYear(null);
      setExpandedMonthInYear(null);
      closeCalendarView();
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-blue-600">Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 hover:text-red-800 focus:outline-none"
        >
          Clear Error
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full sm:max-w-3xl mx-auto p-2 sm:p-4 bg-white shadow-lg rounded-xl max-h-screen overflow-y-auto box-border">
      <div className="flex justify-between items-center mb-6">
        <div className="w-full flex flex-col items-start">
          <div className="flex items-center gap-3">
            <span className="block w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-2"></span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-blue-400 tracking-tight drop-shadow-sm">Attendance Dashboard</h2>
          </div>
        </div>
        <div className="flex space-x-4">
            <button
              onClick={handleBackToAdmin}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg shadow-sm font-semibold transition-all duration-200 hover:bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 max-w-[180px] w-full sm:w-auto text-xs md:text-sm"
              style={{ minWidth: 0 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <span className="truncate block">Back</span>
            </button>
            <button
              onClick={handleRefreshData}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-sm font-semibold transition-all duration-200 hover:from-green-600 hover:to-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 max-w-[200px] w-full sm:w-auto text-sm"
              style={{ minWidth: 0 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5a2 2 0 002 2h5m5 5v5a2 2 0 01-2 2h-5m9-9a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="block whitespace-nowrap">Refresh</span>
            </button>
        </div>
      </div>

      {viewMode === 'dailyMarking' && (
        <>
          <div className="mb-6">
            <label htmlFor="date-select" className="block text-lg font-medium text-gray-700 mb-2">
              Select Date:
            </label>
            <input
              type="date"
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full md:w-auto"
            />
          </div>

          <div className="overflow-x-auto h-[500px] overflow-y-auto" onScroll={handleScroll}>
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status on {formatDateForDisplay(selectedDate)}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    History
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedEmployees.length > 0 ? (
                  sortedEmployees.slice(0, visibleEmployeesCount).map((employee) => {
                    const currentStatus = attendanceStatusToday[employee.id];
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    <img className="h-10 w-10 rounded-full object-cover" src={employee.photo} alt={employee.name} />
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                    <div className="text-sm text-gray-500">{employee.job_title}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              currentStatus === "Present"
                                ? "bg-green-100 text-green-800"
                                : currentStatus === "Absent"
                                ? "bg-red-100 text-red-800"
                                : currentStatus === "Leave"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {capitalize(currentStatus || "N/A")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleMarkAttendance(employee.id, "Present")}
                              disabled={currentStatus === "Present"}
                              className={`px-6 py-3 rounded-lg text-white shadow-lg transition duration-200 font-bold hover:shadow-xl hover:scale-105 ${
                                currentStatus === "Present"
                                  ? "bg-green-500 cursor-not-allowed"
                                  : "bg-green-700 hover:bg-green-800"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(employee.id, "Absent")}
                              disabled={currentStatus === "Absent"}
                              className={`px-6 py-3 rounded-lg text-white shadow-lg transition duration-200 font-bold hover:shadow-xl hover:scale-105 ${
                                currentStatus === "Absent"
                                  ? "bg-red-500 cursor-not-allowed"
                                  : "bg-red-700 hover:bg-red-800"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(employee.id, "Leave")}
                              disabled={currentStatus === "Leave"}
                              className={`px-6 py-3 rounded-lg text-white shadow-lg transition duration-200 font-bold hover:shadow-xl hover:scale-105 ${
                                currentStatus === "Leave"
                                  ? "bg-yellow-500 cursor-not-allowed"
                                  : "bg-yellow-700 hover:bg-yellow-800"
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => openHistoryModal(employee)}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-200 hover:shadow-md transition duration-200 font-semibold"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No employees found or loaded.
                      <button
                         onClick={handleRefreshData}
                         className="ml-2 text-sm text-blue-600 hover:underline"
                      >
                         Click to refresh
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-center sm:justify-end items-center gap-3 sm:gap-4 mt-8 w-full">
            {propEmployeeId && propEmployeeName && (
                <button
                  onClick={() => setViewMode('employeeSummary')}
                  className="flex items-center justify-center gap-2 bg-white border border-blue-600 text-blue-700 px-4 py-2 rounded-full shadow font-semibold transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-[220px] w-full sm:w-auto text-sm md:text-base"
                  style={{ minWidth: 0 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  <span className="truncate block">View {propEmployeeName.split(' ')[0]}'s Attendance</span>
                </button>
            )}
            <button
              onClick={() => setViewMode('allSummary')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full shadow font-semibold transition-all duration-200 hover:from-purple-700 hover:to-purple-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-[180px] w-full sm:w-auto text-sm md:text-base"
              style={{ minWidth: 0 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="truncate block">All Employees</span>
            </button>
          </div>
        </>
      )}

      {viewMode === 'employeeSummary' && propEmployeeId && propEmployeeName && (
        <div className="mt-8">
          <h3 className="2xl font-bold text-gray-800 mb-4">Overall Attendance for {propEmployeeName}</h3>
          {employeeOverallSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Month & Year</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Present</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Absent</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Days Marked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employeeOverallSummary.map(sheet => (
                    <tr key={sheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {capitalize(sheet.month)} {sheet.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-700">
                        {sheet.summary.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-700">
                        {sheet.summary.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-700">
                        {sheet.summary.leave}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                        {sheet.summary.present + sheet.summary.absent + sheet.summary.leave}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No overall attendance data found for {propEmployeeName}.</p>
          )}
        </div>
      )}

      {viewMode === 'allSummary' && (
        <div className="mt-8">
          <h3 className="2xl font-bold text-gray-800 mb-4">Overall Attendance for All Employees</h3>
          {calendarEmployee && (
            <div className="mb-4 p-4 rounded-lg bg-gray-100 flex flex-wrap items-center justify-center space-x-4">
              <span className="font-semibold text-gray-700">Calendar Legend:</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span>Leave</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <span>Not Marked</span>
              </div>
            </div>
          )}
          {Object.keys(groupedAttendanceByYearAndMonth).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedAttendanceByYearAndMonth).map(([year, monthsData]) => (
                <div key={year} className="border border-gray-200 rounded-lg shadow-sm">
                  <button
                    className="flex justify-between items-center w-full px-6 py-4 bg-blue-50 hover:bg-blue-100 rounded-lg focus:outline-none transition duration-200"
                    onClick={() => toggleYearAccordion(year)}
                  >
                    <span className="text-lg font-bold text-blue-800">
                      {year}
                    </span>
                    <svg
                      className={`w-6 h-6 text-blue-600 transition-transform duration-200 ${
                        expandedYear === year ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {expandedYear === year && (
                    <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                      {Object.entries(monthsData).map(([month, sheets]) => (
                        <div key={month} className="border border-gray-100 rounded-md shadow-sm">
                          <button
                            className="flex justify-between items-center w-full px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-md focus:outline-none transition duration-200"
                            onClick={() => toggleMonthAccordion(month)}
                          >
                            <span className="text-md font-semibold text-gray-700">
                              {month}
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                                expandedMonthInYear === month ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>

                          {expandedMonthInYear === month && (
                            <div className="p-3 bg-white border-t border-gray-100 overflow-x-auto">
                                {calendarEmployee ? (
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-lg font-bold">
                                                Attendance Calendar for {calendarEmployee.name}
                                            </h4>
                                            <button
                                                onClick={closeCalendarView}
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm transition duration-200"
                                            >
                                                Back
                                            </button>
                                        </div>
                                        <Calendar
                                            className="mx-auto react-calendar-override"
                                            tileContent={({ date, view }) => {
                                                if (view === 'month') {
                                                    const formattedDate = date.toISOString().split('T')[0];
                                                    const status = attendanceRecords[calendarEmployee.id]?.[formattedDate];
                                                    let colorClass = '';
                                                    switch (status) {
                                                        case 'Present':
                                                            colorClass = 'bg-green-500 text-white';
                                                            break;
                                                        case 'Absent':
                                                            colorClass = 'bg-red-500 text-white';
                                                            break;
                                                        case 'Leave':
                                                            colorClass = 'bg-yellow-500 text-black';
                                                            break;
                                                        default:
                                                            colorClass = '';
                                                            break;
                                                    }
                                                    return (
                                                        <div
                                                            className={`w-full h-full flex justify-center items-center text-sm rounded-full ${colorClass}`}
                                                        >
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                            value={null}
                                            tileClassName={({ date, view }) => {
                                                if (view === 'month') {
                                                    const formattedDate = date.toISOString().split('T')[0];
                                                    const status = attendanceRecords[calendarEmployee.id]?.[formattedDate];
                                                    if (status) {
                                                        return `has-attendance-status`;
                                                    }
                                                }
                                                return null;
                                            }}
                                        />
                                        <style jsx="true">{`
                                            .react-calendar-override {
                                                width: 100%;
                                                max-width: 100%;
                                                border: 1px solid #e2e8f0;
                                                border-radius: 0.5rem;
                                                font-family: inherit;
                                                line-height: 1.125em;
                                                background-color: white;
                                            }
                                            .react-calendar-override .react-calendar__tile {
                                                height: 48px;
                                                display: flex;
                                                justify-content: center;
                                                align-items: center;
                                                position: relative;
                                                border-radius: 9999px;
                                            }
                                            .react-calendar-override .react-calendar__tile.react-calendar__tile--now {
                                                background: #f0f4f8;
                                            }
                                            .react-calendar-override .react-calendar__tile > div {
                                                width: 90%;
                                                height: 90%;
                                                display: flex;
                                                justify-content: center;
                                                align-items: center;
                                                border-radius: 9999px;
                                                position: absolute;
                                                top: 50%;
                                                left: 50%;
                                                transform: translate(-50%, -50%);
                                                z-index: 1;
                                            }
                                            .react-calendar-override .react-calendar__tile > div > abbr {
                                                z-index: 2;
                                                position: relative;
                                            }
                                            .react-calendar-override .react-calendar__tile--active,
                                            .react-calendar-override .react-calendar__tile--hasActive,
                                            .react-calendar-override .react-calendar__tile:enabled:hover,
                                            .react-calendar-override .react-calendar__tile:enabled:focus {
                                                background-color: #f3f4f6;
                                                color: inherit;
                                            }
                                        `}</style>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sheets.map(sheet => {
                                            const employeeName = employees.find(e => e.id === sheet.profile)?.name || 'Unknown Employee';
                                            return (
                                                <button
                                                    key={sheet.id}
                                                    onClick={() => openCalendarForEmployee({ id: sheet.profile, name: employeeName })}
                                                    className="w-full text-left px-4 py-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors duration-200 focus:outline-none"
                                                >
                                                    <span className="font-medium text-gray-800">{employeeName}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No overall attendance data found for all employees.</p>
          )}
        </div>
      )}

      {showHistoryModal && selectedEmployeeForModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Attendance History for {selectedEmployeeForModal.name}
            </h3>
            <div className="overflow-y-auto max-h-[70vh] border border-gray-200 rounded-lg">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords[selectedEmployeeForModal.id] &&
                    Object.entries(attendanceRecords[selectedEmployeeForModal.id])
                      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                      .map(([date, status]) => (
                        <tr key={date} className="border-b">
                          <td className="px-4 py-4 text-gray-700">{formatDateForDisplay(date)}</td>
                          <td
                            className={`px-4 py-4 text-center font-semibold ${
                              status === "Present" ? "text-green-600" : status === "Absent" ? "text-red-600" : "text-yellow-600"
                            }`}
                          >
                            {status}
                          </td>
                        </tr>
                      ))}
                  {(!attendanceRecords[selectedEmployeeForModal.id] || Object.keys(attendanceRecords[selectedEmployeeForModal.id]).length === 0) && (
                    <tr key="no-records-row">
                      <td colSpan="2" className="px-4 py-4 text-center text-gray-500">No attendance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={closeHistoryModal}
              className="mt-4 bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg shadow-md transition font-bold hover:shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;