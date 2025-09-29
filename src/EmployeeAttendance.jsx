// your_react_project/src/pages/EmployeeAttendance.jsx

import React, { useState, useEffect } from "react";
import axiosInstance from "./axiosInstance";

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

// Add day formatter
const getDayName = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
  } catch (error) {
    return '';
  }
};

// Update formatTime function to handle backend time format
const formatTime = (timeString) => {
  if (!timeString) return { time24: '-', time12: '-' };
  
  try {
    // Assuming timeString is in "HH:MM:SS" format
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

function EmployeeAttendance({ employeeId, employeeName, onBack }) {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canMarkAttendance, setCanMarkAttendance] = useState(true);
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [isActionsVisible, setIsActionsVisible] = useState(true);
  const [showLocation, setShowLocation] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const fetchMonthlyAttendance = async () => {
    try {
      // Update URL to include employeeId
      const response = await axiosInstance.get(`attendance/monthly/${employeeId}/`);
      setMonthlyData(response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to load attendance data");
    }
  };

  const markAttendance = async (status) => {
    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const location = `${position.coords.latitude},${position.coords.longitude}`;
      const currentDate = new Date().toISOString().split('T')[0];

      const payload = {
        status: status,  // Now accepts 'Present', 'Absent', or 'Leave'
        date: currentDate,
        location: location
      };

      console.log('Sending attendance payload:', payload); // Debug log

      const response = await axiosInstance.post('attendance/create/', payload);
      
      if (response.data) {
        console.log('Attendance marked successfully:', response.data); // Debug log
        await fetchMonthlyAttendance();
      }
    } catch (err) {
      console.error('Attendance marking error:', err.response || err); // Detailed error logging

      if (err.name === 'GeolocationPositionError') {
        setError("Please enable location services to mark attendance");
        return;
      }
      
      if (err.response?.status === 500) {
        setError("Server error. Please try again or contact support.");
      } else if (err.response?.status === 403) {
        setCanMarkAttendance(false);
        setError("You are not allowed to mark attendance at this time.");
      } else {
        setError(err.response?.data?.error || "Failed to mark attendance");
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMonthlyAttendance();
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleYear = (year) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const toggleMonth = (monthYear) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthYear)) {
        newSet.delete(monthYear);
      } else {
        newSet.add(monthYear);
      }
      return newSet;
    });
  };

  // Group records by year and month
  const groupedRecords = monthlyData.reduce((acc, month) => {
    if (!acc[month.year]) {
      acc[month.year] = {};
    }
    acc[month.year][month.month] = {
      ...month,
      daily_records: month.daily_records || []
    };
    return acc;
  }, {});

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">My Attendance</h1>
                <p className="text-sm text-gray-500">{employeeName || 'Employee'}</p>
              </div>
            </div>
            
            {/* Only show action toggle button */}
            {canMarkAttendance && (
              <button
                onClick={() => setIsActionsVisible(!isActionsVisible)}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                title={isActionsVisible ? "Hide Actions" : "Show Actions"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 transition-transform duration-300 ${
                    isActionsVisible ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Collapsible Action Buttons */}
          <div className={`transition-all duration-300 ease-in-out ${
            isActionsVisible ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            <div className="px-4 pb-4 flex gap-2">
              <button 
                onClick={() => markAttendance('Present')}
                className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Present
              </button>
              <button 
                onClick={() => markAttendance('Absent')}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Absent
              </button>
              <button 
                onClick={() => markAttendance('Leave')}
                className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Adjust top padding to account for fixed header */}
      <div className="flex-1 pt-32 p-4 overflow-y-auto">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Attendance History */}
        <div className="space-y-4">
          {Object.entries(groupedRecords).reverse().map(([year, months]) => (
            <div key={year} className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center gap-2 p-4 hover:bg-gray-50"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expandedYears.has(year) ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-lg">{year}</span>
                <span className="text-sm text-gray-500">({Object.keys(months).length} months)</span>
              </button>

              {expandedYears.has(year) && (
                <div className="border-t">
                  {Object.entries(months).reverse().map(([month, data]) => {
                    const monthYear = `${year}-${month}`;
                    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

                    return (
                      <div key={monthYear} className="border-b last:border-b-0">
                        <button
                          onClick={() => toggleMonth(monthYear)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className={`w-4 h-4 transition-transform ${expandedMonths.has(monthYear) ? 'rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="font-medium">{monthName}</span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">{data.total_present} Present</span>
                            <span className="text-red-600">{data.total_absent} Absent</span>
                          </div>
                        </button>

                        {expandedMonths.has(monthYear) && (
                          <div className="border-t bg-gray-50 p-4">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Time</th>
                                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {data.daily_records.map((record) => (
                                  <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(record.date)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{getDayName(record.date)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="font-medium">{formatTime(record.time).time24}</span>
                                        <span className="text-xs text-gray-400">{formatTime(record.time).time12}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                        record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                        record.status === 'Leave' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {record.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmployeeAttendance;