// your_react_project/src/pages/EmployeeAttendance.jsx

import React, { useState, useEffect } from "react";

// Helper function to get the number of days in a month
function getDaysInMonth(year, monthName) {
  const monthNumber = getMonthNumber(monthName);
  return new Date(year, monthNumber + 1, 0).getDate();
}

// Helper function to get the day of the week for the first day of the month (0 = Sunday, 6 = Saturday)
function getFirstDayOfMonth(year, monthName) {
  const monthNumber = getMonthNumber(monthName);
  return new Date(year, monthNumber, 1).getDay();
}

// Helper function to get month number for sorting and Date object creation
function getMonthNumber(monthName) {
  const months = {
    "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
    "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
  };
  return months[monthName];
}

function EmployeeAttendance({ employeeId, employeeName, onBack }) {
  const [monthlyAttendanceSheets, setMonthlyAttendanceSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://employeemanagement.company/api/my-sheets/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired or unauthorized. Please log in again.");
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        setMonthlyAttendanceSheets(data);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError("Failed to load attendance data. " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Group attendance sheets by year
  const groupedByYear = monthlyAttendanceSheets.reduce((acc, sheet) => {
    const year = sheet.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(sheet);
    return acc;
  }, {});

  // Sort years in descending order
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (sheetId) => {
    setExpandedMonths(prev => ({ ...prev, [sheetId]: !prev[sheetId] }));
  };

  return (
    <div className="fixed inset-0 bg-neutral-50 z-20 flex flex-col font-sans">
      {/* Top Navigation Bar for Attendance View */}
      <div className="bg-white border-b border-neutral-200 py-3 px-4 shadow-sm relative z-10 flex items-center justify-center">
        <h1 className="text-xl font-semibold text-neutral-900 text-center">Attendance Records</h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pt-4 pb-8">
        <div className="mx-4 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-white p-4">
            <h2 className="text-lg font-bold text-neutral-900 mb-2">
              {employeeName}'s Attendance History
            </h2>
            {loading && (
              <p className="text-neutral-600 text-center">Loading attendance data...</p>
            )}
            {error && (
              <p className="text-red-600 text-center">{error}</p>
            )}
            {!loading && !error && sortedYears.length === 0 && (
              <p className="text-neutral-600 text-center">No attendance records found.</p>
            )}
            {!loading && !error && sortedYears.length > 0 && (
              <div className="space-y-6">
                {sortedYears.map(year => (
                  <div key={year} className="border border-neutral-200 rounded-lg overflow-hidden">
                    {/* Year Header - Clickable to toggle */}
                    <button
                      className="w-full text-left py-3 px-4 bg-neutral-50 hover:bg-neutral-100 flex justify-between items-center text-lg font-semibold text-neutral-800"
                      onClick={() => toggleYear(year)}
                    >
                      <span>{year}</span>
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedYears[year] ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>

                    {/* Months Container - Conditionally rendered */}
                    {expandedYears[year] && (
                      <div className="divide-y divide-neutral-100">
                        {/* Sort months within the year */}
                        {groupedByYear[year]
                          .sort((a, b) => getMonthNumber(a.month) - getMonthNumber(b.month))
                          .map(sheet => (
                            <div key={sheet.id} className="bg-white">
                              {/* Month Header - Clickable to toggle */}
                              <button
                                className="w-full text-left py-3 px-6 hover:bg-neutral-50 flex justify-between items-center text-base font-medium text-neutral-700"
                                onClick={() => toggleMonth(sheet.id)}
                              >
                                <span>{sheet.month}</span> {/* Removed Status: {sheet.status} */}
                                <svg
                                  className={`w-4 h-4 transition-transform ${expandedMonths[sheet.id] ? 'rotate-90' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                              </button>

                              {/* Daily Entries and Calendar - Conditionally rendered */}
                              {expandedMonths[sheet.id] && (
                                <div className="p-4 pt-0">
                                  {sheet.summary && (
                                    <div className="flex justify-around text-sm mb-3 border-b pb-2">
                                      <span className="text-green-700">Present: {sheet.summary.present}</span> {/* Changed to text-green-700 */}
                                      <span className="text-red-700">Absent: {sheet.summary.absent}</span>
                                      <span className="text-blue-700">Leave: {sheet.summary.leave}</span>
                                    </div>
                                  )}

                                  {/* Calendar View */}
                                  <div className="mb-4">
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-500 mb-2">
                                      <div>Sun</div>
                                      <div>Mon</div>
                                      <div>Tue</div>
                                      <div>Wed</div>
                                      <div>Thu</div>
                                      <div>Fri</div>
                                      <div>Sat</div>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                      {/* Render empty cells for leading days of the week */}
                                      {[...Array(getFirstDayOfMonth(sheet.year, sheet.month))].map((_, i) => (
                                        <div key={`empty-${i}`} className="p-2"></div>
                                      ))}
                                      {/* Render days of the month */}
                                      {[...Array(getDaysInMonth(sheet.year, sheet.month))].map((_, dayIndex) => {
                                        const day = dayIndex + 1;
                                        const fullDate = `${sheet.year}-${(getMonthNumber(sheet.month) + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        const attendanceEntry = sheet.entries.find(entry => entry.date === fullDate);
                                        let statusClass = '';
                                        if (attendanceEntry) {
                                          switch (attendanceEntry.status) {
                                            case 'Present':
                                              statusClass = 'bg-green-500 text-white';
                                              break;
                                            case 'Absent':
                                              statusClass = 'bg-red-500 text-white';
                                              break;
                                            case 'Leave':
                                              statusClass = 'bg-blue-500 text-white';
                                              break;
                                            default:
                                              statusClass = 'bg-neutral-200 text-neutral-700';
                                          }
                                        } else {
                                          statusClass = 'text-neutral-700'; // Default for days without entries
                                        }

                                        return (
                                          <div
                                            key={day}
                                            className={`p-2 rounded-full flex items-center justify-center aspect-square ${statusClass}`}
                                            title={attendanceEntry ? `${attendanceEntry.status}` : ''}
                                          >
                                            {day}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Go Back Button */}
        <div className="mx-4 mt-5 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={onBack}
            className="w-full py-3 bg-white text-blue-600 font-normal text-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors duration-100 ease-in-out"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeAttendance;