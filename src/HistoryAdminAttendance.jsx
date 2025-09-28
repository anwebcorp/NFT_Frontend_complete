import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  if (!timeString) return { time24: '-', time12: '-' };
  try {
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

const HistoryAdminAttendance = ({ selectedEmployee }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedYearMonths, setExpandedYearMonths] = useState(new Set());

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!selectedEmployee?.id) {
        setAttendanceData([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await axiosInstance.get(`attendance/monthly/${selectedEmployee.id}/`);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid data received from server');
        }

        // Filter records for the selected employee only
        const allRecords = response.data
          .filter(month => {
            // Only include records that belong to the selected employee
            return month.daily_records?.some(record => record.monthly === selectedEmployee.id);
          })
          .flatMap(month => 
            month.daily_records
              .filter(record => record.monthly === selectedEmployee.id) // Additional filter to ensure only selected employee records
              .map(record => ({
                ...record,
                year: month.year,
                month: month.month
              }))
          );
        
        const sortedData = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAttendanceData(sortedData);
        setError(null);
        
        // Auto-expand current month
        const today = new Date();
        const currentYearMonth = `${today.getFullYear()}-${today.getMonth() + 1}`;
        setExpandedYearMonths(new Set([currentYearMonth]));
      } catch (err) {
        console.error("Failed to fetch attendance history:", err);
        setError(`Failed to load attendance history for ${selectedEmployee.name}`);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, [selectedEmployee]); // Dependency on selectedEmployee ensures refresh when employee changes

  const toggleYearMonth = (yearMonth) => {
    setExpandedYearMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(yearMonth)) {
        newSet.delete(yearMonth);
      } else {
        newSet.add(yearMonth);
      }
      return newSet;
    });
  };

  const groupByYearAndMonth = (data) => {
    // Sort data by date in descending order first
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sortedData.reduce((acc, record) => {
      const date = new Date(record.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}-${month}`;

      if (!acc[yearMonth]) {
        acc[yearMonth] = {
          year,
          month,
          records: []
        };
      }

      // Add record to the month's records
      acc[yearMonth].records.push(record);
      return acc;
    }, {});
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const groupedData = groupByYearAndMonth(attendanceData);
  // Sort years and months in descending order
  const sortedYearMonths = Object.entries(groupedData).sort((a, b) => {
    const [yearMonthA] = a[0].split('-').map(Number);
    const [yearMonthB] = b[0].split('-').map(Number);
    return yearMonthB - yearMonthA;
  });

  return (
    <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        {sortedYearMonths.map(([yearMonth, data]) => (
          <div key={yearMonth} className="border-b last:border-b-0">
            <button
              onClick={() => toggleYearMonth(yearMonth)}
              className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            >
              <span className="font-medium">
                {new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <svg
                className={`w-5 h-5 transform transition-transform ${expandedYearMonths.has(yearMonth) ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedYearMonths.has(yearMonth) && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {record.day}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                          {record.time ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {formatTime(record.time).time24}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(record.time).time12}
                              </span>
                            </div>
                          ) : '-'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {record.location ? (
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => window.open(`https://www.google.com/maps?q=${record.location}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View Location
                              </button>
                              <span className="text-xs text-gray-500 mt-1 select-all">
                                {record.location}
                              </span>
                            </div>
                          ) : '-'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-800' :
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
        ))}
      </div>
    </div>
  );
};


    
export default HistoryAdminAttendance;

